<script lang="ts">
  import { page } from '$app/stores';
  import { colors, type CaseDrop, type SkinRarity, type SkinWear } from '$lib';
  import { convertPrice } from '$lib';
  import { _ } from 'svelte-i18n';
  
  export let caseDrops: CaseDrop[];
  export let caseData: { websiteName?: string; imgName?: string; price?: number } = {};

  let isOddsModalOpen = false;

  function openOddsModal() { isOddsModalOpen = true; }
  function closeOddsModal() { isOddsModalOpen = false; }

  function getSkinPath(weapon: string, skin: string) {
    const w = weapon.toLowerCase().replace(/\s/g, '_');
    const s = skin.toLowerCase().replace(/\s/g, '_');
    return `/skins/${w}_${s}.png`;
  }

  function getRarityColor(rarity: string) {
    const r = String(rarity).toLowerCase();
    if (r.includes('restricted') || r.includes('purple') || r.includes('violet') || r === 'violet' || r === '2') return '#a855f7';
    if (r.includes('classified') || r.includes('pink') || r === 'pink' || r === '3') return '#ec4899';
    if (r.includes('covert') || r.includes('red') || r === 'red' || r === '4') return '#ef4444';
    if (r.includes('mil-spec') || r.includes('blue') || r === 'blue' || r === '1') return '#3b82f6';
    if (r.includes('gold') || r.includes('yellow') || r === 'gold' || r === '5') return '#eab308';
    return '#3b82f6';
  }

  let activeCaseImg = '';
  let caseImageName = '';
  let resolvedCaseName = 'Skrzynka';
  let resolvedCasePrice = 0;

  function getFirstValidString(...args: any[]) {
    for (const arg of args) {
      if (arg !== null && arg !== undefined && arg !== '') {
        return String(arg);
      }
    }
    return '';
  }

  function getFirstValidNumber(...args: any[]) {
    for (const arg of args) {
      if (arg !== null && arg !== undefined && !isNaN(Number(arg))) {
        return Number(arg);
      }
    }
    return 0;
  }

  $: {
    activeCaseImg = getFirstValidString(caseData?.imgName, $page.data?.caseData?.imgName, $page.data?.imgName);
    caseImageName = activeCaseImg ? decodeURIComponent(activeCaseImg.split('/').pop().split('?')[0]) : '';
    resolvedCaseName = getFirstValidString(caseData?.websiteName, $page.data?.caseData?.websiteName, $page.data?.websiteName, 'Skrzynka');
    resolvedCasePrice = getFirstValidNumber(caseData?.price, $page.data?.caseData?.price, $page.data?.price);
  }

  // Siatka główna (zgrupowane do kart)
  const parsedDisplayDrops = (() => {
    const uniqueKeys = [];
    for (const drop of caseDrops) {
      uniqueKeys.push({ name: drop.skinName, weapon: drop.weaponName });
    }
    const filtered = uniqueKeys.filter(
      ((s) => (o) => ((k) => !s.has(k) && s.add(k))(['name', 'weapon'].map((k) => o[k as keyof typeof o].toString()).join('|')))(new Set())
    );
    const returnArr = [];
    for (const obj of filtered) {
      const allMatchingDrops = caseDrops.filter((item) => item.skinName == obj.name && item.weaponName == obj.weapon);
      const displayDrop: any = {
        displayChance: allMatchingDrops[0].displayChance,
        skinRarity: allMatchingDrops[0].skinRarity,
        weaponName: allMatchingDrops[0].weaponName,
        skinName: allMatchingDrops[0].skinName,
        details: allMatchingDrops.map(d => ({ quality: d.skinQuality, price: Number(d.skinPrice), range: d.oddsRange, odds: d.displayOdds }))
      };
      
      const wearSortOrder: SkinWear[] = ['FN', 'MW', 'FT', 'WW', 'BS'];
      displayDrop.details.sort((a: any, b: any) => wearSortOrder.indexOf(a.quality) - wearSortOrder.indexOf(b.quality));
      returnArr.push(displayDrop);
    }
    
    const ordering: { [key in SkinRarity]?: number } = {};
    const sortOrder: SkinRarity[] = ['gold', 'red', 'pink', 'violet', 'blue', 'gray'];
    for (let i = 0; i < sortOrder.length; i++) ordering[sortOrder[i]] = i;

    return returnArr.sort(
      (a, b) =>
        ordering[a.skinRarity]! - ordering[b.skinRarity]! ||
        Math.max(...b.details.map((d: any) => d.price)) - Math.max(...b.details.map((d: any) => d.price))
    );
  })();

  // Płaska lista wszystkich pojedynczych wariantów do modala szans - posortowana numerycznie rosnąco
  const allFlatDrops = (() => {
    const list: any[] = [];
    caseDrops.forEach(d => {
      let rawPrice = d.skinPrice;
      if (typeof rawPrice === 'string') {
        rawPrice = rawPrice.replace(',', '.');
      }
      const parsedPrice = parseFloat(rawPrice) || 0;

      list.push({
        weaponName: d.weaponName,
        skinName: d.skinName,
        quality: d.skinQuality,
        price: parsedPrice,
        odds: d.displayOdds,
        skinRarity: d.skinRarity
      });
    });
    return list.sort((a, b) => a.price - b.price);
  })();

  function toggleDetails(e: any) {
    const card = e.currentTarget.closest('.skin-card-wrapper');
    card?.querySelector('.details-page')?.classList.toggle('hidden');
  }

  function handleImageError(e: Event) {
    const target = e.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  function parsePriceRange(details: any[]) {
    if (!details || details.length === 0) return '';
    const prices = details.map((d) => Number(d.price)).filter((p) => !isNaN(p));
    if (prices.length === 0) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    const formattedMin = convertPrice($page.data.currency, min);
    const formattedMax = convertPrice($page.data.currency, max);

    return min === max ? formattedMin : `${formattedMin} - ${formattedMax}`;
  }
</script>

<div class="container mx-auto px-4 mb-20 mt-16">
  
  <!-- Nagłówek sekcji -->
  <div class="relative flex items-center justify-between mb-8 px-2">
    
    <!-- Lewa strona: Przycisk zakresu szans -->
    <button on:click={openOddsModal} class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121622]/80 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md z-10 cursor-pointer">
      <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
      Zakres szans
    </button>

    <!-- Środek: Tytuł z liniami -->
    <div class="absolute inset-x-0 flex items-center justify-center pointer-events-none px-36">
      <div class="hidden md:block flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/15 mr-6"></div>
      
      <div class="flex flex-col items-center text-center pointer-events-auto">
        <h2 class="text-xs md:text-sm font-extrabold uppercase tracking-[0.2em] text-white">
          Skiny w tej skrzynce
        </h2>
        <span class="text-[10px] text-zinc-400 font-mono tracking-widest mt-0.5">
          {parsedDisplayDrops.length} DOSTĘPNYCH ITEMÓW
        </span>
      </div>

      <div class="hidden md:block flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/15 ml-6"></div>
    </div>

    <div class="invisible">
      <button class="px-4 py-2 text-xs">Zakres szans</button>
    </div>
  </div>

  <!-- SIATKA SKINÓW -->
  <ul class="grid gap-4" style="grid-template-columns: repeat(6, minmax(0, 1fr));">
    {#each parsedDisplayDrops as drop, index}
      {@const rarityColor = getRarityColor(drop.skinRarity)}
      {@const gradId = `hex-grad-${index}`}
      <li class="skin-card-wrapper group relative flex flex-col rounded-2xl bg-[#121622]/95 backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-white/25 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]" style="min-height: 230px;">
        
        <!-- Panel szczegółów -->
        <div class="details-page absolute inset-0 z-40 hidden bg-[#0b0e14]/95 backdrop-blur-2xl p-4 flex flex-col justify-between overflow-y-auto transition-all duration-300 rounded-2xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Stan / Szansa</span>
            <button class="text-xs text-zinc-400 hover:text-white font-bold px-1.5 py-0.5 rounded bg-white/5" on:click={toggleDetails}>✕</button>
          </div>
          <div class="flex flex-col gap-2 my-auto">
            {#each drop.details as details}
              <div class="flex items-center justify-between text-xs bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5">
                <span class="font-mono font-bold text-amber-300">{details.quality}</span>
                <span class="font-mono text-white">{convertPrice($page.data.currency, details.price)}</span>
                <span class="font-mono text-[10px] text-zinc-400">{details.odds}</span>
              </div>
            {/each}
          </div>
          <button class="w-full mt-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider transition-colors" on:click={toggleDetails}>
            Powrót
          </button>
        </div>

        <!-- Nagłówek karty -->
        <div class="relative z-20 grid grid-cols-[24px_1fr_24px] items-start p-3 pb-0 gap-1">
          <button class="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold transition-all hover:bg-white/20 hover:text-white cursor-pointer" on:click={toggleDetails}>
            i
          </button>
          <div class="min-w-0 text-center px-1">
            <div class="text-[11px] uppercase tracking-widest text-zinc-400 font-medium truncate">{drop.weaponName}</div>
            <div class="text-[12px] uppercase tracking-wider font-bold truncate mt-0.5" style="color: {rarityColor};">{drop.skinName}</div>
          </div>
          <div></div>
        </div>

        <!-- Obrazek w środku -->
        <div class="relative flex-1 flex items-center justify-center my-2">
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg class="w-32 h-32 opacity-95 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 100 100">
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color={rarityColor} stop-opacity="0.25" />
                  <stop offset="100%" stop-color={rarityColor} stop-opacity="0.03" />
                </linearGradient>
              </defs>
              <polygon points="50,2 91.5,25 91.5,75 50,98 8.5,75 8.5,25" fill="none" stroke={rarityColor} stroke-width="2" stroke-opacity="0.75" />
              <polygon points="50,20 78,36 78,64 50,80 22,64 22,36" fill="url(#{gradId})" stroke={rarityColor} stroke-width="1" stroke-opacity="0.4" />
            </svg>
          </div>
          <div class="relative z-10 flex h-[120px] w-full items-center justify-center px-3">
            <img 
              src={getSkinPath(drop.weaponName, drop.skinName)} 
              alt=""
              class="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-1"
              on:error={handleImageError}
            />
          </div>
        </div>

        <!-- Stopka karty -->
        <div class="relative z-25 mt-auto p-3 pt-2 bg-gradient-to-t from-[#0e121b] via-[#0e121b]/90 to-transparent flex items-end justify-between gap-2">
          <div class="flex flex-col">
            <span class="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Chance</span>
            <span class="text-[11px] font-mono font-extrabold text-white tracking-wider">{drop.displayChance}</span>
          </div>
          <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out">
            <div class="px-2 py-0.5 rounded-md backdrop-blur-md shadow-2xl" style="background-color: {rarityColor}25; border: 1px solid {rarityColor}60;">
              <span class="text-[12px] font-mono font-bold text-white tracking-wider whitespace-nowrap">
                {parsePriceRange(drop.details)}
              </span>
            </div>
          </div>
        </div>

        <div class="h-1 w-full mt-auto" style="background: {rarityColor}; box-shadow: 0 0 10px {rarityColor};"></div>
      </li>
    {/each}
  </ul>
</div>

<!-- MODAL "ZAKRES SZANS" -->
{#if isOddsModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" on:click|self={closeOddsModal}>
    <div class="relative w-full max-w-5xl bg-gradient-to-br from-[#0e121b] to-[#090c12] border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
      
      <!-- LEWA STRONA MODALA: Sekcja skrzynki -->
      <div class="w-full md:w-[380px] bg-gradient-to-b from-[#161c2c]/90 to-[#101521]/95 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden">
        <div class="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="flex flex-col items-center text-center w-full relative z-10">
          <div class="relative w-64 h-64 flex items-center justify-center mb-6">
            <div class="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent rounded-full filter blur-xl"></div>
            {#if caseImageName}
              <img 
                src={`/cases/${caseImageName}`} 
                alt={resolvedCaseName}
                loading="lazy"
                decoding="async"
                class="relative z-10 max-h-full max-w-full object-contain rounded-2xl drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)] transition-transform duration-500 hover:scale-105"
              />
            {/if}
          </div>

          <h3 class="text-xl font-black uppercase tracking-wider text-white mb-3 drop-shadow-md">
            {resolvedCaseName}
          </h3>

          <div class="px-6 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-mono font-bold text-base shadow-inner flex items-center gap-2">
            <span class="text-xs text-zinc-400 uppercase tracking-widest font-sans">Cena:</span>
            <span class="text-emerald-400">{convertPrice($page.data.currency, resolvedCasePrice)}</span>
          </div>
        </div>
      </div>

      <!-- PRAWA STRONA MODALA: Tabela przedmiotów -->
      <div class="flex-1 flex flex-col overflow-hidden bg-[#0c1018]">
        <!-- Nagłówki tabeli z szerszą kolumną na przedmiot -->
        <div class="grid grid-cols-[1fr_130px_130px] items-center px-6 py-3.5 bg-[#121824] border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          <div>Przedmiot</div>
          <div class="text-center">Cena</div>
          <div class="flex items-center justify-between pl-2">
            <span class="text-center w-full">Szansa</span>
            <button on:click={closeOddsModal} class="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-zinc-400 hover:text-white transition-all text-xs font-bold cursor-pointer flex-shrink-0 ml-1">
              ✕
            </button>
          </div>
        </div>

        <!-- Lista elementów (wiersze) -->
        <div class="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-2.5 custom-scrollbar">
          {#each allFlatDrops as item}
            {@const itemRarityColor = getRarityColor(item.skinRarity)}
            <div class="grid grid-cols-[1fr_130px_130px] items-center px-4 py-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all duration-200 group">
              
              <!-- Kolumna Przedmiot -->
              <div class="flex items-center gap-4 min-w-0 pr-2">
                <div class="w-16 h-12 flex-shrink-0 flex items-center justify-center p-1 bg-black/20 rounded-xl border border-white/5 group-hover:border-white/15 transition-colors">
                  <img src={getSkinPath(item.weaponName, item.skinName)} alt="" class="max-h-full max-w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-200" on:error={handleImageError} />
                </div>
                <div class="min-w-0 flex flex-col">
                  <span class="text-[11px] uppercase tracking-wider text-zinc-400 font-medium truncate">{item.weaponName}</span>
                  <div class="text-xs uppercase font-extrabold flex items-center gap-2 mt-0.5 flex-wrap">
                    <span style="color: {itemRarityColor};" class="drop-shadow-sm">{item.skinName}</span>
                    <span class="text-[10px] font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 shadow-inner whitespace-nowrap">({item.quality})</span>
                  </div>
                </div>
              </div>

              <!-- Kolumna Cena -->
              <div class="text-center font-mono text-xs font-bold text-white group-hover:text-amber-200 transition-colors">
                {convertPrice($page.data.currency, item.price)}
              </div>

              <!-- Kolumna Szansa -->
              <div class="text-center font-mono text-xs font-extrabold text-zinc-300">
                {item.odds}
              </div>

            </div>
          {/each}
        </div>
      </div>

    </div>
  </div>
{/if}