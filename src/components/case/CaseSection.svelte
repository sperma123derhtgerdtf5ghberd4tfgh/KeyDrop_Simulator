<script lang="ts">
  import { goldenNames, convertPrice, type CaseSection } from '$lib';
  import { page } from '$app/stores';

  export let data: CaseSection;

  const categoryMap: Record<string, string[]> = {
    'REGULAR CASES': ['PERFECT', 'LORD', 'SMART', 'ROCKET', 'SHARP', 'TECH', 'ENERGY', 'SPARK', 'TOKEN', 'SIGNAL', 'CAPITAL', 'SERPENT'],
    'PREMIUM CASES': ['ARROW', 'VEST', 'VICE', 'BLOODSHOT', 'FADE', 'LORE', 'UNIVERSE', 'PANDORA'],
    'RARITY': ['MILSPEC', 'RESTRICTED', 'COVERT'],
    'CS2 WEAPONS': ['AK-47', 'M4', 'AWP', 'AGENT', 'USP-S', 'KNIVES', 'GLOVES', 'NEW KNIVES'],
    'HIGH RISK': ['SWAP', 'DAGGERS', '1% PROFIT', '1% KNIFE']
  };

  // Definicje skrzynek eventowych pod bannerem
  const eventCaseNames = ['STREET', 'STROKE', 'MAFIA', 'IRONCLAD', 'FLORA'];
  $: eventCasesList = data.cases.filter(c => eventCaseNames.includes(c.websiteName.toUpperCase()));

  function getCategory(name: string) {
    const upperName = name.toUpperCase().trim();
    for (const [category, names] of Object.entries(categoryMap)) {
      if (names.some(n => upperName === n.toUpperCase())) {
        return category;
      }
    }
    return 'OTHERS';
  }

  function getNumericPrice(caseItem: any) {
    const rawPrice = goldenNames.includes(caseItem.websiteName) 
      ? caseItem.price 
      : convertPrice($page.data.currency, caseItem.price);
    
    if (typeof rawPrice === 'number') return rawPrice;
    
    const cleanString = String(rawPrice)
      .replace(/[^0-9.,]/g, '')
      .replace(/,/g, '');
    
    const parsed = parseFloat(cleanString);
    return isNaN(parsed) ? 0 : parsed;
  }

  $: groupedCases = data.cases.reduce((acc, c) => {
    const cat = getCategory(c.websiteName);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {} as Record<string, typeof data.cases>);

  let hiddenSections: Record<string, boolean> = {};
  const toggleSection = (cat: string) => { hiddenSections[cat] = !hiddenSections[cat]; };

  let activeFilter: string = 'ALL';
  const filterTabs = [
    { id: 'ALL', label: 'Wszystko' },
    { id: 'REGULAR CASES', label: 'Regular' },
    { id: 'RARITY', label: 'Rarity' },
    { id: 'CS2 WEAPONS', label: 'CS2 Weapons' },
    { id: 'HIGH RISK', label: 'Wysokie Ryzyko' },
    { id: 'OTHERS', label: 'Others' }
  ];

  let inBudget = false;
  let sortOrder: 'default' | 'asc' | 'desc' = 'default';

  function toggleSort() {
    if (sortOrder === 'default') sortOrder = 'asc';
    else if (sortOrder === 'asc') sortOrder = 'desc';
    else sortOrder = 'default';
  }

  $: userBalance = Number($page.data.user?.balance ?? 0);

  $: displayCases = (() => {
    const result: Record<string, typeof data.cases> = {};
    const currentFilter = activeFilter;
    const currentSort = sortOrder;
    const filterByBudget = inBudget;
    const currentBalance = userBalance;

    ['REGULAR CASES', 'PREMIUM CASES', 'RARITY', 'CS2 WEAPONS', 'HIGH RISK', 'OTHERS'].forEach(cat => {
      if ((currentFilter === 'ALL' || currentFilter === cat) && groupedCases[cat] && groupedCases[cat].length > 0) {
        let list = [...groupedCases[cat]];

        if (filterByBudget) {
          list = list.filter(item => getNumericPrice(item) <= currentBalance);
        }

        if (currentSort === 'asc') {
          list.sort((a, b) => getNumericPrice(a) - getNumericPrice(b));
        } else if (currentSort === 'desc') {
          list.sort((a, b) => getNumericPrice(b) - getNumericPrice(a));
        }

        if (list.length > 0) {
          result[cat] = list;
        }
      }
    });
    return result;
  })();

  $: visibleCategories = ['REGULAR CASES', 'PREMIUM CASES', 'RARITY', 'CS2 WEAPONS', 'HIGH RISK', 'OTHERS'].filter(cat => displayCases[cat] && displayCases[cat].length > 0);

  function revealOnScroll(node: HTMLElement) {
    node.classList.add('scroll-hidden');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          node.classList.add('scroll-visible');
          obs.unobserve(node);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });
    observer.observe(node);
    return { destroy() { observer.disconnect(); } };
  }

  function handleMouseMove(e: MouseEvent) {
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
  }

  function handleMouseLeave(e: MouseEvent) {
    const card = e.currentTarget as HTMLElement;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)`;
  }
</script>

<style>
  :global(.scroll-hidden) {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  :global(.scroll-hidden.scroll-visible) {
    opacity: 1;
    transform: translateY(0);
  }

  .group:hover .card-shine {
    transform: translate(100%, 100%);
    transition: transform 0.8s ease-in-out;
  }
  .card-shine {
    transform: translate(-100%, -100%);
  }
</style>

<!-- EVENTOWY BANNER ORAZ SKRZYNKI -->
<section class="mb-10 px-4 max-w-7xl mx-auto">
  <div class="relative w-full h-[220px] sm:h-[300px] md:h-[360px] rounded-2xl overflow-hidden mb-6 shadow-2xl">
    <img src="/cases/evencik2.png" alt="Event Background" class="w-full h-full object-cover absolute inset-0" />
    <div class="absolute inset-0 flex items-center justify-center z-10 p-4">
       <img src="/cases/evencik.png" alt="Huge Mess" class="w-[60%] sm:w-[50%] md:w-[42%] h-auto object-contain drop-shadow-2xl" />
    </div>
  </div>

  <div class="flex flex-wrap justify-center gap-4">
    {#each eventCasesList as caseData (caseData.urlName)}
      <div 
        use:revealOnScroll
        class="flex-shrink-0"
        style="width: calc(20% - 0.8rem); min-width: 140px; perspective: 1000px;"
      >
        <a 
          href="/skins/category/{caseData.urlName}" 
          class="group block w-full"
          on:mousemove={handleMouseMove}
          on:mouseleave={handleMouseLeave}
          style="transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);"
        >
          <div class="relative w-full aspect-[3/4] border border-gray-800/90 rounded-2xl overflow-hidden bg-gradient-to-b from-[#181b28] via-[#11131d] to-[#0a0c14] shadow-2xl transition-shadow duration-300 group-hover:border-[#d4af37]/80 group-hover:shadow-[0_20px_40px_rgba(212,175,55,0.2)]">
            
            <div class="absolute inset-0 pointer-events-none overflow-hidden z-20">
              <div class="card-shine absolute -inset-full bg-gradient-to-br from-transparent via-white/[0.08] to-transparent"></div>
            </div>

            <div class="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none z-10"></div>

            <img 
              src={`/cases/${caseData.imgName ? decodeURIComponent(caseData.imgName.split('/').pop().split('?')[0]) : ''}`} 
              alt={caseData.websiteName}
              loading="lazy"
              decoding="async"
              class="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />

            <div class="absolute inset-0 z-30 flex flex-col justify-between p-2.5 pointer-events-none">
              <div class="self-end rounded-xl bg-black/75 px-2.5 py-1 text-[10px] font-extrabold text-[#d4af37] pointer-events-auto border border-[#d4af37]/40 backdrop-blur-md shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:border-[#d4af37]">
                {goldenNames.includes(caseData.websiteName) ? caseData.price : convertPrice($page.data.currency, caseData.price)}
              </div>

              <div class="w-[94%] mx-auto mb-0.5 bg-[#0f111a]/90 border border-gray-700/60 rounded-xl py-1.5 px-3 flex items-center justify-center shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-300 group-hover:border-[#d4af37]/50 group-hover:bg-[#141722]/95 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <span class="text-[10px] font-black uppercase text-gray-100 truncate tracking-wider">{caseData.websiteName}</span>
              </div>
            </div>

          </div>
        </a>
      </div>
    {/each}
  </div>
</section>

<!-- PANEL FILTRÓW -->
<div class="w-full max-w-7xl mx-auto px-4 mb-8">
  <div class="bg-[#12151f]/90 border border-gray-800/80 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md shadow-2xl">
    
    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {#each filterTabs as tab}
        <button
          on:click={() => activeFilter = tab.id}
          class={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeFilter === tab.id
              ? 'bg-[#222738] text-white shadow-lg border border-gray-700/80'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
          }`}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="flex items-center gap-4 px-2">
      <label class="flex items-center gap-2.5 cursor-pointer select-none">
        <span class="text-xs font-semibold text-gray-300">W Twoim budżecie</span>
        <button 
          type="button"
          on:click={() => inBudget = !inBudget}
          class={`w-9 h-5 flex items-center rounded-full p-1 transition-colors duration-300 ${inBudget ? 'bg-[#d4af37]' : 'bg-gray-800 border border-gray-700'}`}
        >
          <div class={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-300 ${inBudget ? 'translate-x-4' : 'translate-x-0'}`}></div>
        </button>
      </label>

      <div class="h-4 w-[1px] bg-gray-800"></div>

      <!-- Przycisk sortowania cen -->
      <button 
        on:click={toggleSort}
        class="text-xs font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1 bg-gray-900/50 px-3 py-1.5 rounded-xl border border-gray-800"
      >
        <span>Cena</span>
        <span class="text-[#d4af37]">
          {#if sortOrder === 'asc'} ↗ (Rosnąco)
          {:else if sortOrder === 'desc'} ↘ (Malejąco)
          {:else} —
          {/if}
        </span>
      </button>
    </div>

  </div>
</div>

<!-- LISTA SEKCJI -->
{#each visibleCategories as categoryName}
  <section class="relative py-8">
    <div class="flex items-center justify-between px-4 mb-6 border-b border-gray-800/80 pb-3 max-w-7xl mx-auto">
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-5 bg-[#d4af37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
        <h2 class="text-white text-lg sm:text-xl font-black uppercase tracking-wider bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          {categoryName}
        </h2>
      </div>
      <button on:click={() => toggleSection(categoryName)} class="text-gray-400 hover:text-white text-xs transition-all duration-200 uppercase font-bold tracking-widest bg-gray-900/60 px-3.5 py-1.5 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50">
        {hiddenSections[categoryName] ? 'POKAŻ ▼' : 'UKRYJ ▲'}
      </button>
    </div>

    {#if !hiddenSections[categoryName]}
      <div class="flex flex-wrap justify-center gap-4 px-2 max-w-7xl mx-auto">
        {#each displayCases[categoryName] as caseData (caseData.urlName)}
          <div 
            use:revealOnScroll
            class="flex-shrink-0"
            style="width: calc(20% - 0.8rem); min-width: 140px; perspective: 1000px;"
          >
            <a 
              href="/skins/category/{caseData.urlName}" 
              class="group block w-full"
              on:mousemove={handleMouseMove}
              on:mouseleave={handleMouseLeave}
              style="transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);"
            >
              
              <div class="relative w-full aspect-[3/4] border border-gray-800/90 rounded-2xl overflow-hidden bg-gradient-to-b from-[#181b28] via-[#11131d] to-[#0a0c14] shadow-2xl transition-shadow duration-300 group-hover:border-[#d4af37]/80 group-hover:shadow-[0_20px_40px_rgba(212,175,55,0.2)]">
                
                <div class="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  <div class="card-shine absolute -inset-full bg-gradient-to-br from-transparent via-white/[0.08] to-transparent"></div>
                </div>

                <div class="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none z-10"></div>

                <img 
                  src={`/cases/${caseData.imgName ? decodeURIComponent(caseData.imgName.split('/').pop().split('?')[0]) : ''}`} 
                  alt={caseData.websiteName}
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                <div class="absolute inset-0 z-30 flex flex-col justify-between p-2.5 pointer-events-none">
                  
                  <div class="self-end rounded-xl bg-black/75 px-2.5 py-1 text-[10px] font-extrabold text-[#d4af37] pointer-events-auto border border-[#d4af37]/40 backdrop-blur-md shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:border-[#d4af37]">
                    {goldenNames.includes(caseData.websiteName) ? caseData.price : convertPrice($page.data.currency, caseData.price)}
                  </div>

                  <div class="w-[94%] mx-auto mb-0.5 bg-[#0f111a]/90 border border-gray-700/60 rounded-xl py-1.5 px-3 flex items-center justify-center shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-300 group-hover:border-[#d4af37]/50 group-hover:bg-[#141722]/95 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                    <span class="text-[10px] font-black uppercase text-gray-100 truncate tracking-wider">{caseData.websiteName}</span>
                  </div>

                </div>

              </div>
            </a>
          </div>
        {/each}
      </div>
    {/if}
  </section>
{/each}