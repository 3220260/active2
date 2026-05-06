/* =========================================
   Mobile offers renderer
   Uses SYNETELAS_MOBILE_OFFERS and keeps compatibility with existing delegated modal handlers.
========================================= */
(function () {
  const THEMES = Object.freeze({
    red: Object.freeze({
      text: 'text-red-600',
      bg: 'bg-red-600',
      hoverBg: 'hover:bg-red-700',
      hoverBorder: 'hover:border-red-600',
      iconHover: 'group-hover:text-red-500',
      lightIcon: 'text-red-400',
      benefitIcon: 'text-red-600',
    }),
    blue: Object.freeze({
      text: 'text-blue-600',
      bg: 'bg-blue-600',
      hoverBg: 'hover:bg-blue-700',
      hoverBorder: 'hover:border-blue-600',
      iconHover: 'group-hover:text-blue-500',
      lightIcon: 'text-blue-400',
      benefitIcon: 'text-blue-600',
    }),
  });

  function getOffers() {
    return Array.isArray(window.SYNETELAS_MOBILE_OFFERS)
      ? window.SYNETELAS_MOBILE_OFFERS
      : [];
  }

  function createIcon(className) {
    const icon = document.createElement('i');
    icon.className = className;
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  function appendTextWithOptionalNote(target, benefit) {
    const text = document.createElement('span');
    text.textContent = benefit.text;

    if (benefit.note) {
      text.appendChild(document.createElement('br'));
      const note = document.createElement('small');
      note.className = 'text-slate-400';
      note.textContent = benefit.note;
      text.appendChild(note);
    }

    if (benefit.strong) {
      const wrapper = document.createElement('div');
      const strong = document.createElement('strong');
      strong.className = 'block text-slate-900 leading-tight';
      strong.textContent = benefit.text;
      wrapper.appendChild(strong);
      target.appendChild(wrapper);
      return;
    }

    target.appendChild(text);
  }

  function createBenefitItem(benefit, theme) {
    const item = document.createElement('li');
    item.className = benefit.note || benefit.strong
      ? 'flex items-start gap-3'
      : 'flex items-center gap-3';

    const icon = createIcon(`${benefit.icon} ${theme.benefitIcon} ${benefit.strong ? 'mt-1 text-lg' : benefit.note ? 'mt-1' : ''}`.trim());
    item.appendChild(icon);
    appendTextWithOptionalNote(item, benefit);

    return item;
  }

  function createOfferCard(offer) {
    const theme = THEMES[offer.color] || THEMES.blue;

    const card = document.createElement('div');
    card.className = [
      'bg-white',
      'p-6',
      'md:p-8',
      'rounded-2xl',
      'border-2',
      'border-transparent',
      theme.hoverBorder,
      'shadow-sm',
      'hover:shadow-2xl',
      'transition',
      'cursor-pointer',
      'group',
      'flex',
      'flex-col',
      'justify-between',
    ].join(' ');
    card.dataset.modalClose = 'mobileModal';
    card.dataset.modalTarget = offer.choiceModalId;

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-6';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flex flex-col';

    const title = document.createElement('span');
    title.className = `font-black text-2xl md:text-3xl ${theme.text} leading-tight`;
    title.textContent = offer.title;

    const price = document.createElement('span');
    price.className = `animate-pulse ${theme.bg} text-white text-xl md:text-2xl font-black px-2 py-1 rounded-lg shadow-sm w-fit mt-1`;
    price.textContent = offer.price;

    titleWrap.appendChild(title);
    titleWrap.appendChild(price);

    const headerIcon = createIcon(`text-3xl text-gray-200 ${offer.icon} ${theme.iconHover} transition relative z-10`);

    header.appendChild(titleWrap);
    header.appendChild(headerIcon);

    const benefits = document.createElement('ul');
    benefits.className = 'text-sm font-medium text-slate-600 space-y-3 mb-8';
    offer.benefits.forEach((benefit) => benefits.appendChild(createBenefitItem(benefit, theme)));

    const action = document.createElement('button');
    action.type = 'button';
    action.className = `w-full py-4 ${theme.bg} text-white rounded-xl font-bold ${theme.hoverBg} shadow-lg transition mt-auto`;
    action.dataset.modalClose = 'mobileModal';
    action.dataset.modalTarget = offer.choiceModalId;
    action.textContent = 'Δες Δικαιολογητικά';

    card.appendChild(header);
    card.appendChild(benefits);
    card.appendChild(action);

    return card;
  }

  function createProcedureButton(offer, procedure) {
    const theme = THEMES[offer.color] || THEMES.blue;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.modalClose = offer.choiceModalId;
    button.dataset.modalTarget = procedure.modalId || offer.processModalId;
    button.dataset.openTabShow = procedure.show;
    button.dataset.openTabHide = procedure.hide;
    button.dataset.openTabActive = procedure.active;
    button.dataset.openTabInactive = procedure.inactive;
    button.textContent = procedure.label;

    if (procedure.style === 'brand') {
      button.className = `w-full min-h-[72px] px-5 py-5 ${theme.bg} text-white rounded-2xl font-black text-sm md:text-base ${theme.hoverBg} shadow-lg transition flex items-center justify-center text-center`;
    } else {
      button.className = 'w-full min-h-[72px] px-5 py-5 bg-slate-800 text-white rounded-2xl font-black text-sm md:text-base hover:bg-slate-900 shadow-lg transition flex items-center justify-center text-center';
    }

    return button;
  }

  function renderProviderGrid() {
    const target = document.getElementById('mobileOffersProviderGrid');
    if (!target) return;

    target.textContent = '';
    getOffers().forEach((offer) => target.appendChild(createOfferCard(offer)));
  }

  function renderChoiceModalOptions() {
    getOffers().forEach((offer) => {
      const targetId = offer.id === 'vodafone-cu' ? 'vodaChoiceOptions' : 'novaChoiceOptions';
      const target = document.getElementById(targetId);
      if (!target) return;

      target.textContent = '';
      offer.procedures.forEach((procedure) => {
        target.appendChild(createProcedureButton(offer, procedure));
      });
    });
  }

  function renderMobileOffers() {
    renderProviderGrid();
    renderChoiceModalOptions();
  }

  window.renderMobileOffers = renderMobileOffers;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMobileOffers, { once: true });
  } else {
    renderMobileOffers();
  }
})();
