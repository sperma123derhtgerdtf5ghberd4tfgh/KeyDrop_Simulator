<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { createToast, convertPrice } from '$lib';
  import { _ } from 'svelte-i18n';
  import {
    Menu,
    MenuButton,
    MenuItems,
    MenuItem,
    Transition
  } from '@rgossiaux/svelte-headlessui';
  import SetBalance from '$components/forms/SetBalance.svelte';

  function togglePayment() {
    document.querySelector('.setBalanceForm')!.classList.toggle('is-open');
  }

  // Automatycznie zamykaj okno i odświeżaj dane, gdy formularz zwróci sukces
  $: if ($page.path || $page.form?.success) {
    document.querySelector('.setBalanceForm')?.classList.remove('is-open');
    if ($page.form?.success) invalidateAll();
  }

  $: totalSkinPrice =
    $page.data.userInventory?.reduce(
      (n: number, o: any) => n + (o.sold || o.upgraded ? 0 : o.globalInvItem?.skinPrice ?? 0),
      0
    ) ?? 0;

  /* eslint-disable indent */
  $: $page.form
    ? createToast({
        header: $page.form.success ? $_('success') : $_('error'),
        message: $_($page.form?.messageKey),
        type: $page.form.success ? 'success' : 'error'
      })
    : null;
  /* eslint-disable indent */
</script>

<header class="bg-navy-800 relative z-40 border-b border-navy-600/30">
  <div class="flex h-[4.125rem] items-center bg-navy-700 md:mb-3 md:h-[5.625rem] px-4 justify-between">
    
    <!-- Lewa strona: Logo + Główne linki nawigacyjne -->
    <div class="flex items-center gap-6">
      <a href="/" class="w-26 xs:w-32 flex-shrink-0 sm:w-40 transition-transform duration-300 hover:scale-105">
        <img src="/images/kd-logo.svg" alt="KeyDrop" class="block drop-shadow-[0_0_12px_rgba(255,215,0,0.15)]" />
      </a>

      <!-- Główne menu skrótów zaraz za logo -->
      <nav class="hidden xl:flex items-center gap-3 text-xs font-semibold text-navy-200">
        <a href="/free-case" class="group relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-navy-600/50 hover:text-white hover:shadow-lg hover:shadow-amber-500/5">
          <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <svg class="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"><use xlink:href="/icons/icons.svg#free-case"></use></svg>
          <span class="relative z-10">Odbierz za darmo</span>
        </a>

        <a href="/skins/upgrader" class="group relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-navy-600/50 hover:text-white hover:shadow-lg hover:shadow-cyan-500/5">
          <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <svg class="h-5 w-4 text-cyan-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"><use xlink:href="/icons/icons.svg#upgrader"></use></svg>
          <span class="relative z-10">Upgrader</span>
        </a>

        <a href="/case-battle/list" class="group relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-navy-600/50 hover:text-white hover:shadow-lg hover:shadow-rose-500/5">
          <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <svg class="h-5 w-4 text-rose-400 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"><use xlink:href="/icons/icons.svg#case-battle-swords"></use></svg>
          <span class="relative z-10">Case Battle</span>
        </a>
      </nav>
    </div>

    <!-- Prawa strona -->
    <div class="flex items-center gap-2">
      {#if $page.data.user}
        <!-- Box 1: Zielone punkty na górze + Złoto na dole -->
        <div class="flex flex-col rounded-xl overflow-hidden border border-navy-500/40 shadow-md">
          <div class="bg-[#10221c] px-3 py-1 flex items-center gap-2 border-b border-navy-900/60">          </div>
          <div class="bg-[#1a201b] px-3 py-1 flex items-center gap-2">
            <img src="/images/gold-coin.svg" alt="" class="h-3.5 w-3.5 animate-spin-slow" />
            <span class="text-xs font-black text-gold tabular-nums">{$page.data.user?.goldBalance ?? 0}</span>
          </div>
        </div>

        <!-- Box 2: Wartość skinów (Poprawiona ikona pistoletu z viewBox, żeby nie była ucięta) -->
        <div class="hidden md:flex items-center bg-[#291b4e] border border-[#3b2771] rounded-xl px-3 py-1.5 shadow-md gap-3">
          <div class="h-8 w-8 rounded-lg bg-[#38236d] border border-[#4b308f] flex items-center justify-center text-purple-300 flex-shrink-0">
            <svg class="h-4 w-4" viewBox="0 0 576 512" fill="currentColor"><path d="M574.6 150.6c-12.5-12.5-32.8-12.5-45.3 0l-192 192-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l118.6 118.6c12.5 12.5 32.8 12.5 45.3 0l214.6-214.6c12.5-12.5 12.5-32.8 0-45.3zm-324.6 142l-48-48L32 384l128 128 90-90-21.4-21.4-68.6 68.6L68.6 362.6l150.6-150.6 27.4 27.4 22-22z"/></svg>
          </div>
          <div class="text-left flex-grow">
            <p class="text-xs font-black text-purple-200 tabular-nums tracking-wide">
              {convertPrice($page.data.currency, totalSkinPrice)}
            </p>
            <p class="text-[9px] font-bold uppercase tracking-wider text-purple-300/80">
              Wartość skinów
            </p>
          </div>
          <svg class="h-3.5 w-3.5 text-purple-300/70 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
        </div>

        <!-- Box 3: Stan portfela (Dolarek w kwadracie po lewej, kwota na środku, przycisk doładowania po prawej) -->
        <button on:click={togglePayment} class="flex items-center bg-[#333d1b] border border-[#526626] rounded-xl p-1.5 shadow-md gap-3 cursor-pointer group transition-all hover:border-lightgreen">
          <div class="h-8 w-8 rounded-lg bg-[#3d4b1f] border border-[#526626] text-lightgreen flex items-center justify-center shadow-md flex-shrink-0 font-black text-sm">
            $
          </div>
          <div class="text-left px-1">
            <p class="text-xs font-black text-lightgreen tabular-nums tracking-wide">
              {convertPrice($page.data.currency, $page.data.user?.balance ?? 0)}
            </p>
            <p class="text-[9px] font-bold uppercase tracking-wider text-lightgreen/90">
              Stan portfela
            </p>
          </div>
          <div class="h-8 w-8 rounded-lg bg-lightgreen text-navy-950 flex items-center justify-center shadow-md transition-transform group-hover:scale-105 flex-shrink-0 ml-1">
            <svg class="h-4 w-4" viewBox="0 0 22 19" fill="currentColor">
              <path d="M20.825 3.5h-7a6 6 0 0 0 0 12h7v2a1 1 0 0 1-1 1h-18a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2Zm-7 2h8v8h-8a4 4 0 1 1 0-8Zm0 3v2h3v-2h-3Z"/>
            </svg>
          </div>
        </button>

        <!-- Przycisk Ustawień -->
        <a href="/panel/profil" class="hidden sm:flex h-10 w-10 rounded-xl bg-navy-700/80 border border-navy-500/40 items-center justify-center text-navy-300 hover:text-white hover:bg-navy-600 transition-all shadow-md">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </a>

        <!-- Awatar i menu -->
        <div class="flex items-center gap-1.5 bg-navy-800/90 border border-navy-500/40 rounded-xl p-1 shadow-md">
          <a href="/panel/profil" class="relative h-9 w-9 rounded-lg overflow-hidden border border-gold/50 shadow-sm transition-transform hover:scale-105 flex-shrink-0">
            <img src={$page.data.user?.pfpUrl} alt="" class="h-full w-full object-cover" />
          </a>

          <Menu let:open>
            <MenuButton class="h-9 w-9 bg-navy-700/80 rounded-lg flex items-center justify-center text-white hover:bg-navy-600 transition-all">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </MenuButton>
            <div class="absolute right-4 top-16 z-50">
              <Transition show={open} enter="transition duration-200 ease-out" enterFrom="opacity-0 scale-90 -translate-y-2" enterTo="opacity-100 scale-100 translate-y-0" leave="transition duration-150 ease-in" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-90 -translate-y-2">
                <MenuItems class="w-56 bg-navy-800 border border-navy-500/60 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden py-2 flex flex-col gap-0.5">
                  <MenuItem let:active>
                    <a href="/panel/profil" class="px-4 py-2.5 text-xs font-medium text-white transition-all {active ? 'bg-gold text-navy-950 font-bold shadow-md' : 'hover:bg-navy-700/60 hover:text-gold'}">Moje konto</a>
                  </MenuItem>
                  <div class="my-1 border-t border-navy-600/50"></div>
                  <MenuItem let:active>
                    <form action="/login?/logout" method="POST" use:enhance={() => {
                      return async ({ result }) => {
                        invalidateAll();
                        await applyAction(result);
                        window.location.reload();
                      };
                    }}>
                      <button class="w-full text-left px-4 py-2.5 text-xs font-medium text-rose-400 transition-all {active ? 'bg-rose-500 text-white font-bold' : 'hover:bg-rose-500/20 hover:text-rose-300'}" type="submit">Wyloguj się</button>
                    </form>
                  </MenuItem>
                </MenuItems>
              </Transition>
            </div>
          </Menu>
        </div>
      {:else}
        <a href="/login" class="relative group overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 px-5 py-2.5 text-xs font-black text-navy-950 shadow-lg shadow-gold/25 transition-all duration-300 hover:shadow-gold/40 hover:scale-105 active:scale-95">
          <span class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <span class="relative z-10 flex items-center gap-1.5 uppercase tracking-wider">Zaloguj się</span>
        </a>
      {/if}
    </div>

  </div>
</header>

<!-- Modal ustawiania salda -->
<div class="setBalanceForm fixed z-[100] hidden h-full w-full items-center justify-center rounded-lg bg-navy-750/90 backdrop-blur-md p-7 text-left text-xs is-open:flex md:text-xl transition-all duration-300" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
  <div class="relative bg-navy-800 border border-navy-600 rounded-2xl p-6 shadow-2xl max-w-lg w-full">
    <button on:click={togglePayment} class="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-navy-700 text-navy-200 hover:bg-rose-500 hover:text-white transition-all duration-300 group">
      <span class="rotate-45 text-2xl font-bold group-hover:scale-110 transition-transform">+</span>
    </button>
    <SetBalance />
  </div>
</div>