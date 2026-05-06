/* =========================================
   Mobile offers data source
   Edit this file when prices, benefits, colors, or process targets change.
========================================= */
(function () {
  window.SYNETELAS_MOBILE_OFFERS = Object.freeze([
    {
      id: 'vodafone-cu',
      title: 'Vodafone CU',
      price: '100€',
      color: 'red',
      icon: 'fa-solid fa-mobile-screen',
      choiceModalId: 'vodaChoiceModal',
      processModalId: 'vodaModal',
      benefits: Object.freeze([
        {
          icon: 'fa-solid fa-cloud-arrow-down',
          text: '300 GB Data Κάθε μήνα',
          note: 'Ό,τι μείνει μεταφέρεται στον επόμενο μήνα',
        },
        {
          icon: 'fa-solid fa-phone-flip',
          text: 'Απεριόριστη Ομιλία (σταθερά & κινητά)',
        },
        {
          icon: 'fa-solid fa-plane-arrival',
          text: 'Roaming: 200 Λεπτά Ομιλίας και 11 GB',
        },
        {
          icon: 'fa-solid fa-comment-sms',
          text: '100 sms',
        },
        {
          icon: 'fa-solid fa-piggy-bank',
          text: 'Ετήσιο πλάνο επικοινωνίας: 12 μήνες πλήρους κάλυψης χωρίς δεσμεύσεις.',
          strong: true,
        },
      ]),
      procedures: Object.freeze([
        {
          label: 'ΝΕΟΣ ΑΡΙΘΜΟΣ',
          style: 'dark',
          modalId: 'vodaModal',
          show: 'v-new',
          hide: 'v-port',
          active: 'btn-v-new',
          inactive: 'btn-v-port',
        },
        {
          label: 'ΦΟΡΗΤΟΤΗΤΑ',
          style: 'brand',
          modalId: 'vodaModal',
          show: 'v-port',
          hide: 'v-new',
          active: 'btn-v-port',
          inactive: 'btn-v-new',
        },
      ]),
    },
    {
      id: 'nova-q',
      title: 'NOVA Q',
      price: '100€',
      color: 'blue',
      icon: 'fa-solid fa-mobile-screen',
      choiceModalId: 'novaChoiceModal',
      processModalId: 'novaModal',
      benefits: Object.freeze([
        {
          icon: 'fa-solid fa-cloud-arrow-down',
          text: 'Απεριόριστα GB',
        },
        {
          icon: 'fa-solid fa-phone-flip',
          text: 'Απεριόριστη Ομιλία (σταθερά & κινητά)',
        },
        {
          icon: 'fa-solid fa-comment-sms',
          text: '300 sms',
        },
        {
          icon: 'fa-solid fa-piggy-bank',
          text: 'Ετήσιο πλάνο επικοινωνίας: 12 μήνες πλήρους κάλυψης χωρίς δεσμεύσεις.',
          strong: true,
        },
      ]),
      procedures: Object.freeze([
        {
          label: 'ΝΕΟΣ ΑΡΙΘΜΟΣ',
          style: 'dark',
          modalId: 'novaModal',
          show: 'n-new',
          hide: 'n-port',
          active: 'btn-n-new',
          inactive: 'btn-n-port',
        },
        {
          label: 'ΦΟΡΗΤΟΤΗΤΑ',
          style: 'brand',
          modalId: 'novaModal',
          show: 'n-port',
          hide: 'n-new',
          active: 'btn-n-port',
          inactive: 'btn-n-new',
        },
      ]),
    },
  ]);
})();
