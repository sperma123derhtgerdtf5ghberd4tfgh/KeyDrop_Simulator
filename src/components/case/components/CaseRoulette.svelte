<script>
  import {
    colors,
    createToast,
    goldenNames,
    sellItems,
    wearConversions,
    settings,
    convertPrice
  } from '$lib';
  import { invalidateAll } from '$app/navigation';
  import { _ } from 'svelte-i18n';
  import Spinner from '$components/util/Spinner.svelte';
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';

  const WINNING_ITEM = 55;

  export let data;
  let rouletteItems = [];
  let multipleRoulettesItems = [];
  let casePrice = data.price;
  let rouletteCount = 1;

  let currentSpendings = 0;
  let currentWinnings = 0;
  let currentProfit = 0;

  let wonItems = [];
  let soldItems = [];
  let wonItemsPrice;

  let loading = false;
  let sellLoading = false;
  let sellSuccess = false;
  let menuState = 0;

  let caseStartPlayer;
  let caseEndPlayer;
  let rouletteContainer;
  let animationFrameId;
  let btnOverlay;

  function getRarityColor(rarity) {
    const r = String(rarity).toLowerCase();
    if (r.includes('restricted') || r.includes('purple') || r.includes('violet') || r === '2') return '#a855f7';
    if (r.includes('classified') || r.includes('pink') || r === '3') return '#ec4899';
    if (r.includes('covert') || r.includes('red') || r === '4') return '#ef4444';
    if (r.includes('mil-spec') || r.includes('blue') || r === '1') return '#3b82f6';
    if (r.includes('gold') || r.includes('yellow') || r === '5') return '#eab308';
    return colors.bg?.[rarity] || colors.gradient?.[rarity] || '#3b82f6';
  }

  function getDropImage(drop) {
    if (drop.image) return drop.image;
    if (drop.weaponName && drop.skinName) {
      const weapon = drop.weaponName.toLowerCase().replace(/\s+/g, '_');
      const skin = drop.skinName.toLowerCase().replace(/\s+/g, '_');
      return `/skins/${weapon}_${skin}.png`;
    }
    return '';
  }

  function updateCenterScales() {
    if (!rouletteContainer) {
      animationFrameId = requestAnimationFrame(updateCenterScales);
      return;
    }
    const containerRect = rouletteContainer.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;

    const items = rouletteContainer.querySelectorAll('.case-item, .CaseRolls-skin');
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const distance = Math.abs(centerX - itemCenter);
      const maxDistance = rect.width * 0.5;
      let scale = 1;

      if (distance < maxDistance) {
        const factor = 1 - distance / maxDistance;
        scale = 1 + 0.04 * factor;
      }

      const img = item.querySelector('img');
      if (img) {
        img.style.transform = `scale(${scale})`;
      }
    });

    animationFrameId = requestAnimationFrame(updateCenterScales);
  }

  $: userObj = $page.data.user;
  $: balanceKey = data.goldenCase ? 'goldBalance' : 'balance';
  $: currentBalance = userObj ? userObj[balanceKey] : 0;
  $: tooPoor = !userObj || currentBalance < casePrice;
  
  $: wonItemsPrice = wonItems.reduce((n, o) => n + (o.globalInvItem?.skinPrice || 0), 0);

  generateRollItems(rouletteCount);
  function generateRollItems(count) {
    rouletteItems = [];
    multipleRoulettesItems = [];

    if (count === 1) {
      for (let i = 0; i < 60; i++) {
        const rollNumber = Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
        const item = data.drops.find(
          (obj) => obj.oddsRange[0] <= rollNumber && obj.oddsRange[1] >= rollNumber
        );
        if (!item) {
          i--;
          continue;
        }
        rouletteItems.push(item);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const rollItems = [];
        for (let itemI = 0; itemI < 60; itemI++) {
          const rollNumber = Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
          const item = data.drops.find(
            (obj) => obj.oddsRange[0] <= rollNumber && obj.oddsRange[1] >= rollNumber
          );
          if (!item) {
            itemI--;
            continue;
          }
          rollItems.push(item);
        }
        multipleRoulettesItems.push(rollItems);
      }
    }
  }

  function changeRouletteCount(rollCount) {
    document.querySelectorAll('ul.CaseRolls-row').forEach((elm) => {
      elm.getAnimations().forEach((anim) => anim.cancel());
      elm.style.transform = 'translateX(0px)';
    });
    document.querySelectorAll('div.CaseRolls-roll').forEach((elm) => {
      elm.getAnimations().forEach((anim) => anim.cancel());
      elm.style.transform = 'translateY(0px)';
    });

    document.querySelectorAll('.single-roll-winScreen, .multi-roll-winScreen').forEach((elm) => {
      elm.classList.add('hidden');
      elm.classList.remove('flex');
    });

    const singleRoll = document.querySelector('.single-roll');
    const multiRollContainer = document.querySelector('.multi-roll-grid-container');
    const btnArr = [...document.querySelectorAll('.case-count-btn')];
    
    btnArr.forEach((btn, index) => {
      if (index === rollCount - 1) {
        btn.classList.add('case-count-selected-btn');
      } else {
        btn.classList.remove('case-count-selected-btn');
      }
    });

    if (rollCount === 1) {
      singleRoll?.classList.remove('hidden');
      multiRollContainer?.classList.add('hidden');
    } else {
      singleRoll?.classList.add('hidden');
      multiRollContainer?.classList.remove('hidden');
    }

    rouletteCount = rollCount;
    if (btnOverlay) {
      const containerWidth = btnOverlay.parentElement.clientWidth;
      const step = (containerWidth - 8) / 5;
      btnOverlay.style.left = `${4 + (rouletteCount - 1) * step}px`;
      btnOverlay.style.width = `${step}px`;
    }
    casePrice = Math.round(data.price * rouletteCount * 100) / 100;
    generateRollItems(rouletteCount);
  }

  async function handleRoll() {
    generateRollItems(rouletteCount);
    sellSuccess = false;
    [...document.querySelectorAll('.single-sell-btn')].forEach((el) => {
      el.disabled = false;
      el.textContent = `Sprzedaj za: ${convertPrice($page.data.currency, data.price)}`;
      el.classList.remove('opacity-50');
    });
    soldItems = [];

    if (tooPoor) {
      createToast({
        type: 'error',
        header: $_('error'),
        message: $_('toasts.error.messages.notEnoughBalance')
      });
      return;
    }

    document.querySelectorAll('.single-roll-winScreen, .multi-roll-winScreen').forEach((elm) => {
      elm.classList.add('hidden');
      elm.classList.remove('flex');
    });

    loading = true;

    try {
      const res = await fetch('/api/skins/case-open', {
        method: 'POST',
        body: JSON.stringify({ count: rouletteCount, websiteName: data.websiteName }),
        headers: { 'Content-Type': 'application/json' }
      });
      const resBody = await res.json();
      
      if (!res.ok) {
        createToast({ type: 'error', header: $_('error'), message:$_(resBody.messageKey) });
        loading = false;
        return;
      }

      const winningCaseDrops = resBody.caseDrops;
      wonItems = resBody.items;

      if (rouletteCount === 1) {
        rouletteItems[WINNING_ITEM] = winningCaseDrops[0];
      } else {
        winningCaseDrops.forEach((item, i) => (multipleRoulettesItems[i][WINNING_ITEM] = item));
      }

      currentSpendings = casePrice;
      currentWinnings = winningCaseDrops.reduce((sum, obj) => sum + obj.skinPrice, 0);
      currentProfit = currentWinnings - currentSpendings;

      await playRollAnimation();

      const statsHtml = `
        <div class="relative -mx-6 sm:-mx-8 mt-6 bg-[#0b0e14]/95 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-xl">
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          <div class="flex items-center justify-between relative z-10 w-full">
            <div class="flex flex-col items-center justify-center flex-1 border-r border-white/10 text-center">
              <span class="text-[11px] font-black uppercase tracking-widest text-zinc-400">Wydane</span>
              <span class="text-sm sm:text-base font-mono font-bold text-zinc-200 mt-1">${convertPrice($page.data.currency, currentSpendings)}</span>
            </div>
            <div class="flex flex-col items-center justify-center flex-1 border-r border-white/10 text-center">
              <span class="text-[11px] font-black uppercase tracking-widest ${currentProfit >= 0 ? 'text-green-400' : 'text-red-400'}">Profit</span>
              <span class="text-sm sm:text-base font-mono font-bold ${currentProfit >= 0 ? 'text-green-400' : 'text-red-400'} mt-1">
                ${currentProfit >= 0 ? '+' : ''}${convertPrice($page.data.currency, currentProfit)}
              </span>
            </div>
            <div class="flex flex-col items-center justify-center flex-1 text-center">
              <span class="text-[11px] font-black uppercase tracking-widest text-emerald-400">Wygrane</span>
              <span class="text-sm sm:text-base font-mono font-bold text-emerald-400 mt-1">${convertPrice($page.data.currency, currentWinnings)}</span>
            </div>
          </div>
        </div>
      `;

      const actionButtonsHtml = `
        <div class="flex items-center justify-center gap-3 mt-4 w-full">
          <button
            class="reopen-summary-btn flex-1 flex items-center justify-center h-11 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/60 text-slate-200 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider hover:bg-slate-700 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Otwórz ponownie (${rouletteCount})
          </button>
          <button
            class="mass-sell-summary-btn flex-1 flex items-center justify-center h-11 rounded-xl bg-transparent border-2 border-sky-400 text-sky-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider hover:bg-sky-400/10 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Sprzedaj wszystko (${convertPrice($page.data.currency, wonItemsPrice)})
          </button>
        </div>
      `;

      if (rouletteCount === 1) {
        const elm = document.querySelector('.single-roll-winScreen');
        if (elm) {
          elm.classList.remove('hidden');
          elm.classList.add('flex');
          
          const drop = winningCaseDrops[0];
          // Przypisanie prawidłowego dropId (dla jednej skrzynki index 0)
          const actualDropId = wonItems[0]?.dropId || drop.dropId;
          const color = getRarityColor(drop.skinRarity);
          const dropPrice = drop.skinPrice;

          const cardBox = elm.querySelector('.clean-glass-card');
          if (cardBox) cardBox.style.setProperty('--rarity-glow', color);

          const statsWrapper = elm.querySelector('.single-stats-container');
          if (statsWrapper) statsWrapper.innerHTML = statsHtml + actionButtonsHtml;

          const chanceEl = elm.querySelector('.award-chance');
          if (chanceEl) chanceEl.textContent = drop.displayOdds;
          
          const skinEl = elm.querySelector('.award-skin');
          if (skinEl) skinEl.textContent = drop.skinName || '';

          const weaponEl = elm.querySelector('.award-weapon');
          if (weaponEl) weaponEl.textContent = drop.weaponName || '';
          
          const wearEl = elm.querySelector('.award-wear');
          if (wearEl) wearEl.textContent = wearConversions[drop.skinQuality] || drop.skinQuality || '';

          const btnEl = elm.querySelector('.single-sell-btn');
          if (btnEl) {
            btnEl.textContent = `Sprzedaj za: ${convertPrice($page.data.currency, dropPrice)}`;
            btnEl.onclick = () => handleIndividualSell(actualDropId, btnEl);
          }

          const imgEl = elm.querySelector('.award-img');
          if (imgEl) imgEl.src = getDropImage(drop);

          statsWrapper.querySelector('.reopen-summary-btn').addEventListener('click', () => {
            document.querySelectorAll('.single-roll-winScreen, .multi-roll-winScreen').forEach(e => {
              e.classList.add('hidden');
              e.classList.remove('flex');
            });
            switchMenus();
            reOpen();
          });

          statsWrapper.querySelector('.mass-sell-summary-btn').addEventListener('click', async (e) => {
            await handleMassSell(wonItems, e.currentTarget);
          });
        }
      } else {
        const elm = document.querySelector('.multi-roll-winScreen');
        if (elm) {
          elm.classList.remove('hidden');
          elm.classList.add('flex');

          // Tworzymy nową złączoną tablicę, aby dropId się nie pogubiło przy sortowaniu
          let combinedDrops = winningCaseDrops.map((drop, idx) => ({
            ...drop,
            actualDropId: wonItems[idx]?.dropId || drop.dropId
          }));
          
          combinedDrops.sort((a, b) => b.skinPrice - a.skinPrice);

          const container = elm.querySelector('.multi-roll-content-wrapper');
          if (container) {
            container.innerHTML = `
              <div class="multi-rewards-grid gap-3 w-full mb-3" style="display: flex; flex-wrap: wrap; justify-content: center;"></div>
              <div class="w-full max-w-2xl mx-auto">
                ${statsHtml}
                ${actionButtonsHtml}
              </div>
            `;

            const gridContainer = container.querySelector('.multi-rewards-grid');
            combinedDrops.forEach((drop) => {
              const color = getRarityColor(drop.skinRarity);
              const wearText = wearConversions[drop.skinQuality] || drop.skinQuality || '';
              
              const cardDiv = document.createElement('div');
              cardDiv.className = `clean-glass-card relative flex flex-col items-center justify-between rounded-2xl bg-[#121622]/95 backdrop-blur-2xl p-3.5 border border-white/10 overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-white/25`;
              cardDiv.style.cssText = `--rarity-glow: ${color}; width: 175px; min-height: 275px;`;
              
              cardDiv.innerHTML = `
                <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full opacity-25 blur-2xl pointer-events-none" style="background: ${color};"></div>
                
                <div class="relative z-10 flex items-center justify-start w-full mb-0.5">
                  <span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider">${drop.displayOdds}</span>
                </div>

                <div class="relative my-2 flex h-[95px] w-full items-center justify-center">
                  <img src="${getDropImage(drop)}" alt="" class="relative z-10 max-h-full max-w-full object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.85)]" />
                </div>

                <div class="relative z-10 w-full text-center my-1">
                  <div class="text-[9px] uppercase tracking-widest text-zinc-400 font-medium truncate">${drop.skinName || ''}</div>
                  <div class="text-[10px] uppercase tracking-wider text-white font-bold truncate mt-0.5">${drop.weaponName || ''}</div>
                  <div class="text-[8px] font-mono tracking-wider mt-2 uppercase px-2.5 py-0.5 rounded-full inline-block border border-white/10 text-amber-300 bg-black/30">${wearText}</div>
                </div>

                <div class="relative z-10 mt-2.5 w-full">
                  <button
                    class="multi-sell-btn w-full rounded-xl bg-transparent py-2 text-[9px] font-extrabold uppercase text-sky-400 transition-all hover:bg-sky-400/10 tracking-wider border-2 border-sky-400"
                  >
                    Sprzedaj za: ${convertPrice($page.data.currency, drop.skinPrice)}
                  </button>
                </div>
              `;

              const btn = cardDiv.querySelector('.multi-sell-btn');
              // Przekazujemy prawidłowe ID połączone przed sortowaniem
              btn.addEventListener('click', () => handleIndividualSell(drop.actualDropId, btn));

              gridContainer.appendChild(cardDiv);
            });

            container.querySelector('.reopen-summary-btn').addEventListener('click', () => {
              document.querySelectorAll('.single-roll-winScreen, .multi-roll-winScreen').forEach(e => {
                e.classList.add('hidden');
                e.classList.remove('flex');
              });
              switchMenus();
              reOpen();
            });

            container.querySelector('.mass-sell-summary-btn').addEventListener('click', async (e) => {
              await handleMassSell(wonItems, e.currentTarget);
            });
          }
        }
      }

      switchMenus();
      await invalidateAll();
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleIndividualSell(dropId, btnElement) {
    const itemToSell = wonItems.find(i => i.dropId === dropId);
    if (!itemToSell) {
      console.error("Item to sell not found with id:", dropId);
      return;
    }
    
    btnElement.disabled = true;
    const sellData = await sellItems([itemToSell]);
    createToast({
      type: sellData.res.ok ? 'success' : 'error',
      header: sellData.res.ok ? 'sukces' : 'błąd',
      message: $_(sellData.messageKey)
    });

    if (sellData.res.ok) {
      wonItems = wonItems.filter(i => i.dropId !== dropId);
      btnElement.textContent = 'Sprzedano';
      btnElement.classList.add('opacity-50');
      
      // Update wonItemsPrice
      wonItemsPrice = wonItems.reduce((n, o) => n + (o.globalInvItem?.skinPrice || 0), 0);
      const massSellBtn = document.querySelector('.mass-sell-summary-btn');
      if (massSellBtn && wonItemsPrice > 0) {
          massSellBtn.textContent = `Sprzedaj wszystko (${convertPrice($page.data.currency, wonItemsPrice)})`;
      } else if (massSellBtn) {
          massSellBtn.textContent = `Sprzedano wszystko`;
          massSellBtn.disabled = true;
          massSellBtn.classList.add('opacity-50');
      }

      await invalidateAll();
    } else {
      btnElement.disabled = false;
    }
  }

  async function playRollAnimation() {
    const easing = 'cubic-bezier(.1,.8,.01,1)';
    const rectSelection = document.querySelector('.point-arrow-top').getBoundingClientRect();

    if (caseEndPlayer) {
      caseEndPlayer.currentTime = 0;
      caseEndPlayer.pause();
    }
    if (!$settings.muteAudio && caseStartPlayer) {
      caseStartPlayer.currentTime = 0;
      caseStartPlayer.play().catch(() => {});
    }
    const duration = $settings.fastOpen ? 1750 : 7000;
    let interval;

    if (rouletteCount === 1) {
      const bounds = document
        .querySelectorAll('li.case-item')
        [WINNING_ITEM].getBoundingClientRect();
      const x = Math.floor(
        Math.random() *
          (bounds.width * (WINNING_ITEM - 2.5) - bounds.width * (WINNING_ITEM - 3.5)) +
          bounds.width * (WINNING_ITEM - 3.5)
      );
      document
        .querySelector('ul.CaseRolls-row')
        .animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${x}px)` }], {
          iterations: 1,
          duration: duration,
          easing: easing,
          fill: 'forwards'
        });

      const ticked = [];

      interval = setInterval(() => {
        document.querySelectorAll('li.case-item').forEach((li) => {
          const tickIndicator = li.querySelector('.tick-indicator');
          if (!tickIndicator) return;
          const rect = tickIndicator.getBoundingClientRect();
          if (
            !$settings.muteAudio &&
            !ticked.find((el) => el.isSameNode(tickIndicator)) &&
            rect.bottom > rectSelection.top &&
            rect.right > rectSelection.left &&
            rect.top < rectSelection.bottom &&
            rect.left < rectSelection.right
          ) {
            ticked.push(tickIndicator);
            const tickPlayer = new Audio('/audio/case-tick.webm');
            tickPlayer.currentTime = 0.05;
            tickPlayer.play().catch(() => {});
          }
        });
      }, 10);
    } else {
      const roulettes = [...document.querySelectorAll('div.CaseRolls-roll')];
      roulettes.forEach((roulette) => {
        const itemEl = roulette.querySelector('.CaseRolls-skin');
        const itemHeight = itemEl ? itemEl.offsetHeight : 300;
        const y = itemHeight * WINNING_ITEM;
        roulette.animate(
          [
            { transform: 'translateY(0)' },
            { transform: `translateY(-${y}px)` }
          ],
          {
            iterations: 1,
            duration: duration,
            easing: easing,
            fill: 'forwards'
          }
        );
      });

      const tickedIndicators = new Set();
      let lastTickTime = 0;

      interval = setInterval(() => {
        if ($settings.muteAudio) return;
        
        document.querySelectorAll('.CaseRolls-wrapper').forEach((wrapper) => {
          wrapper.querySelectorAll('.CaseRolls-skin').forEach((elm) => {
            const tickIndicator = elm.querySelector('.tick-indicator');
            if (!tickIndicator || tickedIndicators.has(tickIndicator)) return;
            
            const rect = tickIndicator.getBoundingClientRect();
            if (rect.top <= rectSelection.bottom && rect.bottom >= rectSelection.top) {
              tickedIndicators.add(tickIndicator);
              
              const now = Date.now();
              if (now - lastTickTime > 45) {
                lastTickTime = now;
                const tickPlayer = new Audio('/audio/case-tick.webm');
                tickPlayer.currentTime = 0.05;
                tickPlayer.play().catch(() => {});
              }
            }
          });
        });
      }, 5);
    }

    await new Promise((r) => setTimeout(r, duration));
    clearInterval(interval);
    if (!$settings.muteAudio && caseEndPlayer) {
      caseEndPlayer.play().catch(() => {});
    }
  }

  async function switchMenus() {
    menuState = menuState === 0 ? 1 : 0;
    document.querySelector('div.Case-MainUI')?.classList.toggle('is-open');
    document.querySelector('div.Case-AfterOpen')?.classList.toggle('is-open');
  }

  function handleBackdropClick() {
    if (menuState === 1) {
      switchMenus();
      document.querySelectorAll(`.single-roll-winScreen, .multi-roll-winScreen`).forEach((elm) => {
        elm.classList.add('hidden');
        elm.classList.remove('flex');
      });
    }
  }

  function reOpen() {
    if (caseStartPlayer) {
      caseStartPlayer.currentTime = 0;
      caseStartPlayer.pause();
    }
    if (caseEndPlayer) {
      caseEndPlayer.currentTime = 0;
      caseEndPlayer.pause();
    }
    if (rouletteCount === 1) {
      document.querySelector('ul.CaseRolls-row')?.getAnimations().forEach((anim) => anim.cancel());
    } else {
      document.querySelectorAll('div.CaseRolls-roll').forEach((r) => r.getAnimations().forEach((anim) => anim.cancel()));
    }
    switchMenus();
    document.querySelectorAll(`.single-roll-winScreen, .multi-roll-winScreen`).forEach((elm) => {
      elm.classList.add('hidden');
      elm.classList.remove('flex');
    });

    handleRoll();
  }

  async function handleMassSell(skins, customBtn = null) {
    sellLoading = true;
    const soldIDs = soldItems.map((i) => i.dropId);
    const itemsToSell = skins.filter((i) => !soldIDs.includes(i.dropId));
    const IDs = itemsToSell.map((i) => i.dropId);
    const sellData = await sellItems(itemsToSell);
    createToast({
      type: sellData.res.ok ? 'success' : 'error',
      header: sellData.res.ok ? 'sukces' : 'błąd',
      message: $_(sellData.messageKey)
    });

    if (sellData.res.ok) {
      wonItems = wonItems.filter((item) => !IDs.includes(item.dropId));
      wonItemsPrice = 0;
      [...document.querySelectorAll('.single-sell-btn')].forEach((el) => {
        el.disabled = true;
        el.textContent = 'Sprzedano';
        el.classList.add('opacity-50');
      });
      [...document.querySelectorAll('.multi-sell-btn')].forEach((el) => {
        el.disabled = true;
        el.textContent = 'Sprzedano';
        el.classList.add('opacity-50');
      });
      if (customBtn) {
        customBtn.disabled = true;
        customBtn.textContent = 'Sprzedano wszystko';
        customBtn.classList.add('opacity-50');
      }
      sellSuccess = true;
      await invalidateAll();
    }
    sellLoading = false;
  }

  onMount(() => {
    animationFrameId = requestAnimationFrame(updateCenterScales);
  });

  onDestroy(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  });
</script>

<section class="container mx-auto mb-8 mt-1 relative" style="max-width: 1480px;">
  <audio bind:this="{caseStartPlayer}" src="/audio/case-start.webm"></audio>
  <audio bind:this="{caseEndPlayer}" src="/audio/case-end.webm"></audio>

  <div class="relative overflow-visible" bind:this={rouletteContainer}>
    
    <!-- EKRAN WYGRANEJ DLA 1 SKRZYNKI -->
    <div 
      class="single-roll-winScreen fixed inset-0 z-50 hidden items-center justify-center p-3 bg-black/50 backdrop-blur-sm cursor-pointer animate-fade-in"
      on:click="{handleBackdropClick}"
    >
      <div class="flex flex-col items-center cursor-default animate-slide-up pointer-events-auto" on:click|stopPropagation>
        <div 
          class="clean-glass-card relative flex w-[440px] flex-col items-center justify-between rounded-3xl bg-[#0e121b]/95 backdrop-blur-2xl p-6 border border-white/15 overflow-hidden"
        >
          <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full opacity-30 blur-2xl pointer-events-none" style="background: var(--rarity-glow);"></div>

          <div class="relative z-10 flex items-center justify-start w-full mb-0.5">
            <span class="award-chance text-[11px] font-mono font-bold text-zinc-400 tracking-wider"></span>
          </div>

          <div class="relative my-2 flex h-[150px] w-full items-center justify-center">
            <img src="" alt="" class="award-img relative z-10 max-h-full max-w-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:scale-110" />
          </div>

          <div class="relative z-10 w-full text-center my-2">
            <div class="award-skin text-[11px] uppercase tracking-widest text-zinc-400 font-semibold truncate"></div>
            <div class="award-weapon text-sm uppercase tracking-wider text-white font-extrabold truncate mt-0.5"></div>
            <div class="award-wear text-[9px] font-mono tracking-wider mt-2.5 uppercase px-3.5 py-1 rounded-full inline-block border border-white/10 text-amber-300 bg-black/30"></div>
          </div>

          <div class="relative z-10 mt-3 w-full">
            <button
              class="single-sell-btn w-full rounded-xl bg-transparent border-2 border-sky-400 py-3 text-[11px] font-extrabold uppercase text-sky-400 transition-all hover:bg-sky-400/10 disabled:opacity-50 tracking-wider"
            >
              Sprzedaj
            </button>
          </div>
        </div>

        <div class="single-stats-container w-full"></div>
      </div>
    </div>

    <!-- EKRAN ZBIORCZEJ WYGRANEJ DLA MULTI -->
    <div 
      class="multi-roll-winScreen fixed inset-0 z-50 hidden items-center justify-center p-4 bg-black/50 backdrop-blur-sm cursor-pointer animate-fade-in"
      on:click="{handleBackdropClick}"
    >
      <div 
        class="multi-roll-content-wrapper relative flex flex-col items-center justify-center max-w-5xl w-full cursor-default animate-slide-up pointer-events-auto"
        on:click|stopPropagation
      >
      </div>
    </div>

    <!-- Wskaźniki góra/dół -->
    <div class="point-arrow-top absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
      <div class="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,1)]"></div>
    </div>
    <div class="absolute left-1/2 bottom-0 z-30 -translate-x-1/2 translate-y-1/2 pointer-events-none flex flex-col items-center">
      <div class="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,1)]"></div>
    </div>

    <div
      class="relative overflow-hidden bg-navy-800 sm:rounded-lg border border-navy-700 shadow-2xl"
      style="height: 300px;"
    >
      <!-- Pojedyncza rolka -->
      <div
        class="grid-stack single-roll absolute inset-0 grid h-full {rouletteCount !== 1 ? 'hidden' : ''}"
        style="width: 1480px; left: calc(50% - 740px);"
      >
        <ul class="CaseRolls-row flex h-full w-full">
          {#each rouletteItems as item}
            {@const itemColor = getRarityColor(item.skinRarity)}
            <li
              class="case-item relative flex h-full min-w-0 flex-shrink-0 flex-col items-center justify-center border-r-2 border-navy-600 bg-[#151720] overflow-hidden"
              style="width: 14.2857%;"
            >
              <div class="absolute inset-0 pointer-events-none opacity-30" style="background: radial-gradient(circle at center, {itemColor} 0%, transparent 70%); filter: blur(25px);"></div>
              <img
                src="{getDropImage(item)}"
                alt="{item.skinName}"
                class="relative z-10 max-h-[55%] max-w-[85%] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] my-auto transition-transform duration-75 ease-out"
              />
              <div class="absolute bottom-0 left-0 w-full p-3 text-center z-20 bg-gradient-to-t from-[#121319] via-[#121319]/95 to-transparent">
                <div class="truncate text-[11px] text-navy-300 font-semibold tracking-wide uppercase">{item.weaponName}</div>
                <div class="truncate text-[13px] font-ubuntu text-white tracking-wide uppercase mt-0.5">{item.skinName}</div>
                <div class="h-[3px] w-full mt-2 rounded-full" style="background: {itemColor}; box-shadow: 0 0 10px {itemColor};"></div>
              </div>
              <div class="tick-indicator absolute -right-0.5 top-0 h-5 w-1"></div>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Multi rolki -->
      <div 
        class="multi-roll-grid-container absolute inset-0 grid w-full h-full {rouletteCount === 1 ? 'hidden' : ''}"
        style="grid-template-columns: repeat({rouletteCount}, minmax(0, 1fr));"
      >
        {#each multipleRoulettesItems as rouletteItemsArray}
          <div
            class="CaseRolls-wrapper h-full border-r-2 border-navy-600 relative overflow-hidden flex flex-col w-full"
          >
            <div class="CaseRolls-roll absolute top-0 left-0 w-full flex flex-col">
              {#each rouletteItemsArray as caseItem}
                {@const itemColor = getRarityColor(caseItem.skinRarity)}
                <div
                  class="CaseRolls-skin relative flex flex-col items-center justify-center border-b-2 border-navy-600 bg-[#151720] overflow-hidden"
                  style="height: 300px; min-height: 300px;"
                >
                  <div class="absolute inset-0 pointer-events-none opacity-30" style="background: radial-gradient(circle at center, {itemColor} 0%, transparent 70%); filter: blur(20px);"></div>
                  <img
                    src="{getDropImage(caseItem)}"
                    alt="{caseItem.skinName}"
                    class="relative z-10 max-h-[50%] max-w-[85%] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] my-auto transition-transform duration-75 ease-out"
                    loading="eager"
                  />
                  <div class="absolute bottom-0 left-0 w-full p-2.5 text-center z-20 bg-gradient-to-t from-[#121319] via-[#121319]/95 to-transparent">
                    <div class="truncate text-[10px] text-navy-300 font-semibold tracking-wide uppercase">{caseItem.weaponName}</div>
                    <div class="truncate text-[11px] text-white font-bold uppercase mt-0.5">{caseItem.skinName}</div>
                    <div class="h-[3px] w-full mt-1.5 rounded-full" style="background: {itemColor}; box-shadow: 0 0 8px {itemColor};"></div>
                  </div>
                  <div class="tick-indicator absolute -bottom-0.5 left-0 h-5 w-1"></div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Przyciski akcji (po otwarciu) oraz dolny panel -->
  <div class="mt-10 grid w-full px-2 sm:mt-12 sm:w-auto">
    <div class="Case-AfterOpen -z-10 col-start-1 row-start-1 translate-y-4 opacity-0 transition duration-1000 ease-out is-open:z-20 is-open:translate-y-8 is-open:opacity-100 pointer-events-none is-open:pointer-events-auto">
      
      <div class="mx-auto mb-4 grid max-w-5xl grid-cols-2 gap-3 sm:mb-6 sm:gap-4 md:gap-8" style="grid-template-columns: auto 1fr 1fr 1fr;">
        <button
          on:click="{switchMenus}"
          disabled="{menuState === 1}"
          class="flex aspect-square h-12 items-center justify-center rounded-xl border border-solid border-navy-400/50 bg-navy-700 text-center text-2xs font-extrabold uppercase text-navy-200 transition-all duration-200 hover:bg-navy-600 sm:rounded-2xl sm:text-sm"
        >
          <svg class="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5"><use xlink:href="/icons/icons.svg#arrow-left"></use></svg>
        </button>
      </div>
    </div>

    <!-- DOLNY PANEL -->
    <div class="Case-MainUI is-open -z-10 col-start-1 row-start-1 mx-auto flex w-full max-w-[1480px] items-center justify-between -translate-y-5 px-6 py-4 bg-[#161b26]/95 border border-zinc-700/70 rounded-2xl backdrop-blur-2xl opacity-0 transition duration-1000 ease-in-out is-open:z-20 is-open:translate-y-0 is-open:opacity-100">
      
      <!-- Selektor ilości skrzynek (1-5) -->
      <div class="relative flex h-12 w-[220px] bg-[#0e121b]/90 border border-zinc-800 rounded-xl p-1.5 backdrop-blur-xl items-center flex-shrink-0">
        <div 
          bind:this={btnOverlay} 
          style="left: 6px; width: calc((100% - 12px) / 5);" 
          class="absolute top-1.5 z-20 h-[calc(100%-12px)] border-2 border-pastelGreen bg-pastelGreen/10 transition-all duration-300 ease-out rounded-lg pointer-events-none"
        ></div>
        
        {#each [1, 2, 3, 4, 5] as count, i}
          <button
            on:click="{() => changeRouletteCount(count)}"
            disabled="{loading || menuState === 1}"
            class="case-count-btn relative z-10 flex h-full flex-1 items-center justify-center text-center text-xs font-bold text-zinc-300 transition-all hover:text-white rounded-lg border border-zinc-700/50 bg-zinc-900/40 hover:bg-zinc-800/60 mx-0.5 first:ml-0 last:mr-0"
          >
            {count}
          </button>
        {/each}
      </div>

      <!-- Główny przycisk otwierania -->
      <button
        class="ga_openButtonLoser flex h-12 flex-1 max-w-[320px] mx-6 items-center justify-center rounded-xl border-2 px-6 text-xs font-black uppercase tracking-wider transition-all duration-300 relative overflow-hidden group
        {!userObj ? 'border-red-500/80 text-red-400 bg-red-500/10 hover:bg-red-500/25' : currentBalance >= casePrice ? 'border-pastelGreen text-pastelGreen bg-pastelGreen/3 hover:bg-pastelGreen/20 hover:scale-[1.01] active:scale-95' : 'border-red-500/80 text-red-400 bg-red-500/10 hover:bg-red-500/25'}"
        on:click="{handleRoll}"
        disabled="{loading || tooPoor || menuState === 1}"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-white/[0.04] to-transparent pointer-events-none"></div>
        <span class="relative z-10 flex items-center justify-center gap-2 text-center w-full">
          {#if loading}
            <Spinner size="1.3em" borderWidth=".25em" />
          {:else}
            {#if !userObj}
              {$_('case.notLoggedIn')}
            {:else}
              {currentBalance >= casePrice
                ? `${$_('case.open')} ${convertPrice($page.data.currency, casePrice)}`
                : `DODAJ ŚRODKI I ${$_('case.open')} ${convertPrice($page.data.currency, casePrice)}`}
            {/if}
            {#if userObj && goldenNames.includes(data.websiteName)}
              <img src="/icons/gold-coin.webp" class="w-3.5 h-3.5 ml-0.5 object-contain" alt="gold">
            {/if}
          {/if}
        </span>
      </button>

      <!-- Pusty blok dla idealnej symetrii -->
      <div class="hidden md:block w-[220px]"></div>

    </div>
  </div>
</section>

<style>
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .animate-slide-up {
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
</style>