<script lang="ts">
  import { page } from '$app/stores';
  import { convertPrice, sleep, type ParsedCaseBattle, type CaseBattlePlayers } from '$lib';
  import type { CaseDrop } from '@prisma/client';
  import type { Socket } from 'socket.io-client';
  import { _ } from 'svelte-i18n';
  import { fade, scale } from 'svelte/transition';

  export let caseBattleData: ParsedCaseBattle;
  export let socket: Socket;

  export let winnerPos: number | null;
  export let currentRound: number;
  export let visibleItems: number;
  export let countdownContent: number;
  export let winningPositions: number[];
  export let wonItems: { [key: number]: CaseDrop[] };
  export let players: CaseBattlePlayers;
  export let battleOwner: string;
  export let battleMode: 'underdog' | 'classic';

  export let showCountdown: boolean;
  export let battleAnimationOver: boolean;
  export let startBattle: boolean;
  export let rollAnimationOver: boolean;
  export let showAwardInfo: boolean;
  export let showRoulettes: boolean;

  function getLocalSkinPath(weapon: string, skin: string) {
    const w = weapon.toLowerCase().replace(/ /g, '_');
    const s = skin.toLowerCase().replace(/ /g, '_');
    return `/skins/${w}_${s}.png`;
  }

  function leaveBattle(pos: number) {
    socket.emit('caseBattlePlayerLeave', caseBattleData.id, $page.data.user, pos);
  }

  function joinBattle(pos: number) {
    socket.emit('caseBattlePlayerJoin', caseBattleData.id, $page.data.user, pos, false);
  }

  function addBot(pos: number) {
    socket.emit('caseBattlePlayerJoin', caseBattleData.id, null, pos, true);
  }

  async function addAllBots() {
    for (let i = 0; i < caseBattleData.playerCount; i++) {
      if (caseBattleData.players[i]) continue;
      socket.emit('caseBattlePlayerJoin', caseBattleData.id, null, i, true);
      await sleep(250); 
    }
  }

  function findWinningDrop(drops: CaseDrop[], wonItem: CaseDrop) {
    if (!drops || !wonItem) return null;
    return drops.find(d => d.id === wonItem.id || (d.weaponName === wonItem.weaponName && d.skinName === wonItem.skinName && d.skinPrice === wonItem.skinPrice));
  }
</script>

<div
  class="relative hidden gap-x-5 md:grid"
  style="grid-template-columns: repeat({caseBattleData.playerCount}, minmax(0px, 1fr));"
>
  {#if countdownContent > 0 && countdownContent <= 3}
    <div class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div 
        class="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-gold shadow-[0_0_80px_rgba(255,215,0,0.6)] bg-gradient-to-tr from-purple-900/90 via-indigo-950/90 to-blue-900/90 backdrop-blur-md"
      >
        {#key countdownContent}
          <div 
            class="absolute text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 drop-shadow-lg"
            in:scale="{{ duration: 200, start: 0.5 }}" 
            out:fade="{{ duration: 300 }}"
          >
            {countdownContent}
          </div>
        {/key}
      </div>
    </div>
  {/if}

  {#if showCountdown}
    <div
      class="pointer-events-none absolute -top-12 z-10 flex h-24 w-24 flex-shrink-0 scale-100 transform items-center justify-center rounded-full border border-indigo-500/30 opacity-100 transition duration-300 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
      style="left: calc(50% - 3rem); background: radial-gradient(50% 50%, rgb(20, 24, 39) 60%, rgba(79, 70, 229, 0.25) 100%);"
      transition:scale="{{ duration: 250 }}"
    >
      <div
        class="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-indigo-400 text-center text-xl font-bold text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.6)] bg-indigo-950/80"
      >
        {#key countdownContent}
          <div
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            transition:scale="{{ duration: 250 }}"
          >
            {countdownContent}
          </div>
        {/key}
      </div>
    </div>
  {/if}

  {#each Array(caseBattleData.playerCount) as dummy, i}
    <div class="flex flex-col rounded-3xl bg-gradient-to-b from-[#161b2e] via-[#101524] to-[#0b0f19] border border-indigo-500/20 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative">
      
      <!-- GÓRNA SEKCJA ROLKI 3D -->
      <div class="relative grid h-[23rem] w-full place-content-center place-items-center overflow-hidden bg-gradient-to-b from-[#111827] via-[#0b101d] to-[#070a14]">
        
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-600/20 via-purple-600/10 to-transparent pointer-events-none"></div>
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div
          class="absolute inset-0 h-[23rem]"
          style="background: linear-gradient(180deg, rgba(11,15,25,0.6) 0%, {startBattle ? 'rgba(30,27,75,0.3)' : 'rgba(59, 130, 246, 0.08)'} 100%);"
        ></div>

        <div
          class="pointer-events-none absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay transition-opacity duration-500"
          style="background-image: url('https://key-drop.com/web/KD/static/images/case-battle/winner-slot-bg.png?v70');"
        ></div>

        {#if players[i] && !startBattle}
          <div class="relative z-10 flex flex-col items-center transition-opacity duration-500 opacity-{startBattle ? '0' : '100'}">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-950 to-slate-900 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] mb-2">
              <svg class="h-6 w-6 {battleMode === 'underdog' ? 'text-fuchsia-400' : 'text-emerald-400'}">
                <use xlink:href="/icons/icons.svg?39#tick"></use>
              </svg>
            </div>
            <p class="text-xs font-extrabold uppercase tracking-widest text-indigo-200">
              {$_('battles.battlePage.readyToBattle')}
            </p>
            {#if $page.data.user?.id === players[i]?.id}
              <button
                class="mt-3 px-4 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-2xs font-bold uppercase tracking-wider transition-all shadow-md"
                on:click="{() => leaveBattle(i)}"
              >
                <span>{$_('battles.battlePage.leaveBattle')}</span>
              </button>
            {/if}
          </div>
        {/if}

        {#if (!$page.data.user && !players[i]) || (Object.values(players).map((p) => p.id).includes($page.data.user?.id) && !players[i])}
          <div class="relative z-10 flex flex-col items-center transition-opacity duration-500 opacity-{startBattle ? '0' : '100'}">
            <div class="h-10 w-10 mb-2 flex items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <svg class="h-5 w-5 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              {$_('battles.battlePage.waitingForPlayers')}
            </p>
            {#if $page.data.user?.id === battleOwner}
              <div class="flex flex-col items-center gap-2">
                <button
                  class="px-4 py-2 rounded-xl text-2xs font-bold uppercase tracking-wider transition-all shadow-lg hover:scale-105 {battleMode === 'underdog' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-purple-900/50' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/50'}"
                  on:click="{() => addBot(i)}"
                >
                  <span class="flex items-center gap-1.5">
                    <svg class="h-3.5 w-3.5" viewBox="0 0 19 21" fill="none"><path d="M10.5 3.055C15 3.552 18.5 7.367 18.5 12V21H0.5V12C0.5 7.367 4 3.552 8.5 3.055V0H10.5V3.055Z" fill="currentColor"></path></svg>
                    {$_('battles.battlePage.playWithBot')}
                  </span>
                </button>
                <button type="button" class="text-xs uppercase font-bold {battleMode === 'underdog' ? 'text-fuchsia-400 hover:text-fuchsia-300' : 'text-emerald-400 hover:text-emerald-300'} transition-colors" on:click="{() => addAllBots()}">
                  {$_('battles.battlePage.summonBots')}
                </button>
              </div>
            {/if}
          </div>
        {/if}

        <div
          class="transition-opacity duration-700"
          style="opacity: {!battleAnimationOver && rollAnimationOver && winningPositions.length > 1 ? '100' : '0'}"
        >
          <div
            class="drawing-winner pointer-events-none relative flex w-full flex-col items-center justify-center {rollAnimationOver ? 'animate-scale' : ''}"
            style="animation-delay: {(1000 / caseBattleData.playerCount) * i + Math.floor(Math.random() * 100)}ms;"
          >
            <img src="{players[i]?.pfpUrl}" alt="" class="h-32 w-32 rounded-full border-2 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.4)] object-cover" />
            <div class="mt-3 text-xs font-extrabold uppercase tracking-widest text-emerald-300 drop-shadow">
              {players[i]?.username || ''}
            </div>
          </div>
        </div>

        {#if !players[i] && $page.data.user && !Object.values(players).map((p) => p.id).includes($page.data.user?.id)}
          <div class="relative z-10 flex w-full flex-col items-center transition-opacity duration-500 opacity-{startBattle ? '0' : '100'}">
            <p class="text-xs uppercase tracking-wider text-slate-200 mb-3">
              <span class="font-light">{$_('battles.battlePage.ready')}</span>
              <strong class="font-bold ml-1 text-indigo-300">{$_('battles.battlePage.toBattle')}</strong>
            </p>
            <button
              class="px-6 py-2.5 rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl transition-all hover:scale-105 {battleMode === 'underdog' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-purple-900/50' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/50'}"
              on:click="{() => joinBattle(i)}"
            >
              {$_(battleMode == 'underdog' ? 'battles.joinUnderdog' : 'battles.joinClassic')}
            </button>
          </div>
        {/if}

        {#if startBattle && battleAnimationOver}
          <div
            class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070a14]/95 backdrop-blur-md px-5 text-xl uppercase transition-opacity duration-700 {winnerPos === i ? 'text-emerald-400' : 'text-red-500'}"
            transition:fade="{{ duration: 700 }}"
          >
            {#if winnerPos === i}
              <div class="text-2xl font-black tracking-widest mb-1 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.5)]">{$_('battles.battlePage.winner')}</div>
              <div class="w-28 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent my-2"></div>
              <div class="flex items-center justify-center text-xs tracking-wide">
                <span class="mr-1.5 text-emerald-400 font-bold">{$_('battles.battlePage.totalPrize')}</span>
                <span class="text-white font-extrabold">
                  {convertPrice($page.data.currency, Object.values(wonItems).flat().reduce((t, d) => (t += d.skinPrice), 0))}
                </span>
                <span class="ml-1 text-xs text-slate-400 font-medium">
                  ({convertPrice('eur', Object.values(wonItems).flat().reduce((t, d) => (t += d.skinPrice), 0))})
                </span>
              </div>
            {:else}
              <div class="text-xl font-extrabold tracking-widest text-red-500/90 drop-shadow">{$_('battles.battlePage.loser')}</div>
            {/if}
          </div>
        {/if}

        <!-- 3D ROULETTE WHEEL -->
<div class="absolute h-[23rem] min-w-full transition-opacity duration-300 opacity-{showRoulettes ? '100' : '0'}">
          <div
            class="CaseBattleDisplayRoll-rollRatioBox grid h-full w-full justify-self-center overflow-hidden"
            style="perspective: 80px; contain: content; mask-image: linear-gradient(rgba(255, 255, 255, 0.1), black, rgba(255, 255, 255, 0.1)); -webkit-mask-image: linear-gradient(rgba(255, 255, 255, 0.1), black, rgba(255, 255, 255, 0.1));"
          >
            <div
              class="CaseBattleDisplayRoll-wheel col-start-1 row-start-1 h-full w-full will-change-transform"
              style="transform-style: preserve-3d; transform: translate3d(0px, 0px, -1698.91px) rotateX(340deg); transition: transform 18s cubic-bezier(0.1, 0, 0.1, 1);"
            >
              {#each caseBattleData.drops[i][currentRound] as caseItem, j}
                {@const roundWonItem = wonItems[i]?.[currentRound]}
                {@const isThisRoundWinner = rollAnimationOver && roundWonItem && caseItem.weaponName === roundWonItem.weaponName && caseItem.skinName === roundWonItem.skinName && caseItem.skinPrice === roundWonItem.skinPrice}
                
                <!-- Sprawdzamy ceny wszystkich wygranych w tej rundzie przez wszystkich graczy -->
                {@const allRoundPrices = Object.values(wonItems).map(playerDrops => playerDrops?.[currentRound]?.skinPrice ?? 0)}
                {@const maxRoundPrice = Math.max(...allRoundPrices, 0)}
                {@const isHighestInRound = roundWonItem && roundWonItem.skinPrice === maxRoundPrice && maxRoundPrice > 0}

                <!-- Poświata włącza się tylko wtedy, gdy animacja się skończy, to jest wygrany item gracza I ma najwyższą cenę w tej rundzie -->
                {@const showGlow = rollAnimationOver && isThisRoundWinner && isHighestInRound}

                <div
                  class="CaseBattleDisplayRoll-skin absolute left-0 top-0 h-full w-full p-4 flex items-center justify-center"
                  style="backface-visibility: hidden; transform: rotateX({j * (360 / 36)}deg) translateZ(1658.91px); opacity: 1;"
                >
                  <!-- ZIELONA POŚWIATA NA DROŻSZYM/NAJDROŻSZYM SKINIE -->
                  {#if showGlow}
                    <div class="absolute w-44 h-44 rounded-full bg-emerald-500/30 blur-2xl pointer-events-none"></div>
                    <div class="absolute w-32 h-32 rotate-45 rounded-2xl bg-gradient-to-br from-emerald-500/40 via-emerald-600/20 to-transparent border border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.6)] pointer-events-none"></div>
                  {/if}

                  <img
                    src={getLocalSkinPath(caseItem.weaponName, caseItem.skinName)}
                    alt=""
                    class="relative z-10 block h-4/5 w-4/5 object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
                  />
                  {#if rollAnimationOver}
                    <div class="absolute bottom-2 left-3 right-3 z-20 bg-gradient-to-r from-slate-900/95 via-indigo-950/95 to-slate-900/95 backdrop-blur-md rounded-2xl border border-indigo-500/40 p-2 text-center pointer-events-none shadow-2xl">
                      <div class="text-[10px] font-bold text-white truncate">{caseItem.weaponName}</div>
                      <div class="text-[9px] text-indigo-200 truncate mb-0.5">{caseItem.skinName}</div>
                      <div class="text-[9px] text-amber-400 font-extrabold">{caseItem.skinQuality} • {convertPrice($page.data.currency, caseItem.skinPrice ?? 0)}</div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- DOLNY PANEL WYNIKU ROLKI -->
        <div
          class="CaseBattleDisplayRoll-wonItemData absolute bottom-0 left-0 z-10 flex w-full min-w-0 flex-row items-center justify-between px-5 py-3.5 text-2xs font-semibold uppercase leading-tight bg-gradient-to-t from-[#070a14] via-[#070a14]/90 to-transparent transition duration-300 opacity-{showAwardInfo ? '100' : '0'} border-t border-indigo-500/20"
        >
          <div class="flex-1 truncate pr-2">
            <div class="truncate text-indigo-300 text-[10px] font-medium">{wonItems[i][currentRound]?.skinName}</div>
            <div class="truncate text-xs font-bold text-white">{wonItems[i][currentRound]?.weaponName}</div>
          </div>
          <div class="text-right">
            <span class="text-xs font-black text-amber-400 drop-shadow">
              {convertPrice($page.data.currency, wonItems[i][currentRound]?.skinPrice ?? 0)}
            </span>
            <span class="ml-1 text-[10px] font-medium text-slate-400">
              ({convertPrice('eur', wonItems[i][currentRound]?.skinPrice ?? 0)})
            </span>
          </div>
        </div>
      </div>

      <!-- SEKCJA UŻYTKOWNIKA -->
      <div class="z-10 flex items-center justify-between bg-gradient-to-r from-[#13192d] via-[#101627] to-[#13192d] px-5 py-4 border-t border-b border-indigo-500/20">
        <div class="flex items-center gap-3">
          {#if players[i]}
            <img src="{players[i]?.pfpUrl}" alt="" class="h-10 w-10 rounded-2xl object-cover border border-indigo-500/40 shadow-md" />
          {:else}
            <div class="h-10 w-10 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shadow-inner">?</div>
          {/if}
          <div class="flex flex-col">
            <span class="text-xs font-extrabold uppercase tracking-wider text-white max-w-[110px] truncate">
              {players[i]?.username || 'Wolne miejsce'}
            </span>
            <span class="text-[10px] text-indigo-300/80 uppercase font-semibold">Gracz #{i + 1}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-[#0d1220] border border-indigo-500/30 px-3.5 py-2 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
          {#if winningPositions.includes(i)}
            <svg
              class="icon h-4 w-4 text-emerald-400 {battleMode === 'underdog' ? 'rotate-180' : ''}"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              transition:fade="{{ duration: 250 }}"
            >
              <path d="M1 16L9 11L17 16" stroke-width="3"></path>
              <path d="M1 7L9 2L17 7" stroke-width="3"></path>
            </svg>
          {/if}
          {#key visibleItems}
            <div class="flex items-center text-xs font-black text-emerald-400">
              <span>
                {convertPrice($page.data.currency, wonItems[i]?.slice(0, visibleItems).reduce((t, d) => (t += d.skinPrice), 0) ?? 0)}
              </span>
              <span class="ml-1 text-[10px] font-medium text-slate-400">
                ({convertPrice('eur', wonItems[i]?.slice(0, visibleItems).reduce((t, d) => (t += d.skinPrice), 0) ?? 0)})
              </span>
            </div>
          {/key}
        </div>
      </div>
      
      <!-- DOLNA SIATKA ITEMÓW -->
      <div class="p-4 bg-[#0a0e18]">
        <div class="grid gap-2.5" style="grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));">
          {#each new Array(caseBattleData.totalCases) as dummy, roundIndex}
            {#if visibleItems > roundIndex && wonItems[i]?.[roundIndex]}
              <div class="group relative" transition:fade="{{ duration: 150 }}">
                <div
                  class="group relative flex aspect-[10/13] w-full select-none flex-col items-center justify-between rounded-2xl border border-indigo-500/20 bg-[#121828] hover:border-indigo-400/50 transition-all duration-300 p-2 shadow-lg"
                  style="background-image: url('/images/browseritembg.webp'); background-size: cover; background-position: center;"
                >
                  <div class="h-3 w-full"></div>
                  
                  <div class="flex w-full items-center justify-between">
                    <span class="text-[9px] font-bold uppercase text-slate-300">
                      {wonItems[i][roundIndex].skinQuality}
                    </span>
                    <span class="rounded-lg bg-[#070a14] px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400 border border-indigo-500/30">
                      {convertPrice($page.data.currency, wonItems[i][roundIndex].skinPrice ?? 0)}
                    </span>
                  </div>

                  <div class="relative flex-1 w-full my-1 flex items-center justify-center">
                    <img
                      src={getLocalSkinPath(wonItems[i][roundIndex].weaponName, wonItems[i][roundIndex].skinName)}
                      alt=""
                      class="pointer-events-none max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div class="w-full text-center">
                    <p class="truncate text-[10px] font-bold uppercase leading-tight text-white" title="{wonItems[i][roundIndex].weaponName}">
                      {wonItems[i][roundIndex].weaponName}
                    </p>
                    <p class="truncate text-[9px] uppercase leading-tight text-indigo-200/70" title="{wonItems[i][roundIndex].skinName}">
                      {wonItems[i][roundIndex].skinName}
                    </p>
                  </div>
                </div>
              </div>
            {:else}
              <div class="relative flex aspect-[10/13] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-500/20 bg-[#0d1220]/50 text-center">
                <div class="w-5 h-5 rounded-xl border border-indigo-500/20 flex items-center justify-center text-[9px] text-indigo-400/60 font-bold">{roundIndex + 1}</div>
              </div>
            {/if}
          {/each}
        </div>
      </div>

    </div>
  {/each}
</div>