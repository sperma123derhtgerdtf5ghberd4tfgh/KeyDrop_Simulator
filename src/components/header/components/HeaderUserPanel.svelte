<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { createToast, convertPrice } from '$lib';
  import { _ } from 'svelte-i18n';
  import { Menu, MenuButton, MenuItems, Transition, MenuItem } from '@rgossiaux/svelte-headlessui';

  $: $page.form
    ? /* eslint-disable indent */
      createToast({
        header: $page.form.success ? $_('success') : $_('error'),
        message: $_($page.form?.messageKey),
        type: $page.form.success ? 'success' : 'error'
      })
    : null;
  /* eslint-disable indent */

  function togglePayment() {
    document.querySelector('.setBalanceForm')!.classList.toggle('is-open');
  }
</script>

<div class="order-5 ml-auto flex items-center self-stretch rounded-l-2xl md:bg-navy-800/80">
  
  <!-- Saldo PLN / Waluta -->
  <div class="hidden items-center gap-x-3 pl-3 lg:flex lg:pl-5">
    <div class="flex h-full items-center gap-x-5">
      <div class="flex items-center gap-x-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#000902] lg:h-9 lg:w-9">
          <svg
            class="icon h-4 w-4 flex-shrink-0 text-lightgreen lg:h-5 lg:w-5"
            viewBox="0 0 22 19"
            fill="currentColor"
          >
            <path
              d="M20.825 3.5h-7a6 6 0 0 0 0 12h7v2a1 1 0 0 1-1 1h-18a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2Zm-7 2h8v8h-8a4 4 0 1 1 0-8Zm0 3v2h3v-2h-3Z"
            ></path>
          </svg>
        </div>
        <div class="text-gray-300">
          <p class="text-xs font-bold tabular-nums text-lightgreen lg:text-sm">
            <span>{convertPrice($page.data.currency, $page.data.user?.balance)}</span>
          </p>
          <p class="whitespace-nowrap text-2xs font-semibold uppercase leading-none tracking-wider">
            {$_('header.balance')}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Złoto (Gold) -->
  <div class="hidden items-center pl-3 lg:pl-4 md:flex">
    <a href="/#gold-area" class="flex items-center gap-1.5 rounded-lg bg-[#121216] px-2.5 py-1.5 text-xs font-bold tabular-nums text-gold border border-gold/25">
      <img src="/images/gold-coin.svg" alt="" class="h-4 w-4 object-contain" />
      <span>{$page.data.user?.goldBalance ?? 0}</span>
    </a>
  </div>

  <!-- Przeniesione skróty w kolejności z wzorca: Free Case, Case Battle, Upgrader -->
  <div class="hidden items-center gap-2 pl-3 lg:flex lg:pl-4">
    <a
      href="/free-case"
      class="flex items-center gap-1.5 rounded-lg bg-[#121216] px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-700 transition"
    >
      <span>Free Case</span>
    </a>
    <a
      href="/case-battle/list"
      class="flex items-center gap-1.5 rounded-lg bg-[#121216] px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-700 transition"
    >
      <svg class="h-4 w-4 text-white">
        <use xlink:href="/icons/icons.svg#case-battle-swords"></use>
      </svg>
      <span>Case Battle</span>
    </a>
    <a
      href="/skins/upgrader"
      class="flex items-center gap-1.5 rounded-lg bg-[#121216] px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-700 transition"
    >
      <svg class="h-4 w-4 text-white">
        <use xlink:href="/icons/icons.svg#upgrader"></use>
      </svg>
      <span>Upgrader</span>
    </a>
  </div>

  <!-- Przycisk Doładuj (Depozyt) -->
  <div
    class="flex items-center justify-center rounded-l-2xl md:bg-[#121216] md:px-3 lg:px-5"
    style="opacity: 1;"
  >
    <button
      on:click="{togglePayment}"
      class="group relative flex h-9 items-center gap-x-2 overflow-hidden whitespace-nowrap rounded-lg border border-lightgreen-200 bg-[#121b16] px-3 py-2 text-xs font-bold text-lightgreen transition hover:bg-lightgreen-200/10 md:h-auto lg:px-4 lg:py-2.5"
    >
      <svg
        class="icon h-4 w-4 flex-shrink-0 text-lightgreen"
        viewBox="0 0 22 19"
        fill="currentColor"
      >
        <path
          d="M20.825 3.5h-7a6 6 0 0 0 0 12h7v2a1 1 0 0 1-1 1h-18a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2Zm-7 2h8v8h-8a4 4 0 1 1 0-8Zm0 3v2h3v-2h-3Z"
        ></path>
      </svg>
      <span class="uppercase tracking-wider">DOŁADUJ</span>
    </button>
  </div>

  <!-- Sekcja Użytkownika / Nazwa, Awatar i Menu -->
  <div
    class="flex items-center self-stretch rounded-l-2xl pl-4 pr-3 md:gap-3 md:bg-navy-550 md:pl-3 lg:gap-4 lg:px-5"
  >
    <div class="hidden flex-col gap-1 md:flex" style="opacity: 1;">
      <a href="/panel/profil" class="min-w-[8rem] text-sm font-bold text-white truncate">
        {$page.data.user?.username}
      </a>
      <div class="flex items-center gap-2">
        <a href="/#gold-area" class="cursor-pointer">
          <span class="flex items-center gap-1 text-xs font-bold tabular-nums text-gold">
            <img src="/images/gold-coin.svg" alt="" class="h-3.5 w-3.5 object-contain" />
            <span>{$page.data.user?.goldBalance ?? 0}</span>
          </span>
        </a>
      </div>
    </div>
    <div>
      <a
        href="/panel/profil"
        aria-label="Profil"
        class="hidden h-12 w-12 overflow-hidden rounded-xl border border-navy-400 md:block"
      >
        <img class="h-full w-full object-cover" src="{$page.data.user?.pfpUrl}" alt="" />
      </a>
    </div>
    <Menu let:open>
      <MenuButton
        class="h-9 w-9 cursor-pointer rounded-lg bg-navy-600 flex items-center justify-center transition hover:bg-navy-400 md:h-9 md:w-9"
      >
        <svg class="h-4 w-4 text-white transition-transform duration-200" style="transform: rotate({open ? '180deg' : '0deg'})">
          <use xlink:href="/icons/icons.svg#arrow-down"></use>
        </svg>
      </MenuButton>
      <div
        class="fixed left-0 top-[4.125rem] z-50 md:absolute md:left-auto md:right-6 md:top-[5.625rem]"
      >
        <Transition
          show="{open}"
          enter="transition-all duration-200"
          enterFrom="scale-90 opacity-0"
          enterTo="scale-100 opacity-100"
          leave="transition-all duration-200"
          leaveFrom="scale-100 opacity-100"
          leaveTo="scale-90 opacity-0"
        >
          <div
            class="flex h-screen w-screen origin-top transform flex-col overflow-scroll bg-navy-550 opacity-100 focus:outline-none md:h-auto md:w-60 md:origin-top-right md:overflow-hidden md:rounded-b-xl shadow-2xl border border-navy-400/50"
          >
            <MenuItems class="flex flex-col">
              <MenuItem>
                <div
                  class="flex items-center rounded-b-xl rounded-t-xl bg-navy-750 px-2.5 py-6 md:rounded-t-none md:p-5"
                  role="none"
                >
                  <a class="flex-shrink-0" href="/panel/profil">
                    <img
                      src="{$page.data.user?.pfpUrl}"
                      alt=""
                      class="md:h-12 md:w-12 mr-4 h-16 w-16 rounded-xl object-cover"
                    />
                  </a>
                  <div class="w-full md:w-auto">
                    <a
                      href="/panel/profil"
                      class="block text-base font-semibold uppercase text-navy-100 md:mb-1 md:text-sm truncate max-w-[120px]"
                    >
                      {$page.data.user?.username}
                    </a>
                    <div class="flex items-center">
                      <svg
                        class="icon mr-2 h-4 w-4 text-lightgreen md:h-3.5 md:w-3.5"
                        viewBox="0 0 22 19"
                        fill="currentColor"
                        role="none"
                      >
                        <path
                          d="M20.825 3.5h-7a6 6 0 0 0 0 12h7v2a1 1 0 0 1-1 1h-18a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2Zm-7 2h8v8h-8a4 4 0 1 1 0-8Zm0 3v2h3v-2h-3Z"
                          role="none"
                        ></path>
                      </svg>
                      <span
                        class="text-base font-bold uppercase tabular-nums text-lightgreen md:text-sm"
                        role="none"
                      >
                        {convertPrice($page.data.currency, $page.data.user?.balance ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </MenuItem>
              <MenuItem>
                <a
                  href="/panel/profil"
                  class="flex items-center py-2.5 text-white hover:bg-gold hover:text-navy-750 transition-colors"
                >
                  <svg class="mx-6 h-4 w-4">
                    <use xlink:href="/icons/icons.svg#new-account"></use>
                  </svg>
                  <span class="text-sm">{$_('header.nav.myAccount')}</span>
                </a>
              </MenuItem>
              <MenuItem disabled>
                <p class="my-2 ml-6 text-xs text-navy-200 uppercase font-semibold tracking-wider" role="none">
                  {$_('header.nav.games')}
                </p>
              </MenuItem>
              <MenuItem>
                <a
                  href="/case-battle/list"
                  class="flex items-center py-2.5 text-white hover:bg-gold hover:text-navy-750 transition-colors"
                >
                  <svg class="mx-6 h-4 w-4">
                    <use xlink:href="/icons/icons.svg#case-battle-swords"></use>
                  </svg>
                  <span class="text-sm">Case Battle</span>
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href="/skins/upgrader"
                  class="flex items-center py-2.5 text-white hover:bg-gold hover:text-navy-750 transition-colors"
                >
                  <svg class="mx-6 h-4 w-4">
                    <use xlink:href="/icons/icons.svg#upgrader"></use>
                  </svg>
                  <span class="text-sm">Upgrader</span>
                </a>
              </MenuItem>
              <MenuItem>
                <form
                  action="/login?/logout"
                  method="POST"
                  use:enhance="{() => {
                    return async ({ result }) => {
                      invalidateAll();
                      await applyAction(result);
                      window.location.reload();
                    };
                  }}"
                >
                  <button
                    class="mt-1 flex w-full items-center border-t border-navy-400 py-3 text-white hover:bg-gold hover:text-navy-750 transition-colors md:rounded-b-xl"
                    type="submit"
                  >
                    <svg class="mx-6 h-4 w-4">
                      <use xlink:href="/icons/icons.svg#new-logout"></use>
                    </svg>
                    <span class="text-sm">{$_('header.logout')}</span>
                  </button>
                </form>
              </MenuItem>
            </MenuItems>
          </div>
        </Transition>
      </div>
    </Menu>
  </div>
</div>