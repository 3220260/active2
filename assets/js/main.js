/* =========================================
   1. CORE SETTINGS & TRACKING
   ========================================= */
const GA_MEASUREMENT_ID = 'G-ZXPYBSBLTX';
const IMAGE_PREVIEW_MIN_ZOOM = 1;
const IMAGE_PREVIEW_MAX_ZOOM = 4;
const MIN_CARD_VIEW_SECONDS = 2;
const SWIPE_BACK_MIN_DISTANCE = 90;
const SWIPE_BACK_MAX_VERTICAL_DISTANCE = 70;
const SWIPE_BACK_MAX_DURATION_MS = 900;
const SWIPE_BACK_EDGE_GUARD = 24;
const TRACKED_OFFERS = Object.freeze({
    mobileModal: 'Κινητή Τηλεφωνία',
    vodaModal: 'Vodafone CU',
    novaModal: 'NOVA Q',
    novaLinePhone: 'Σταθερό και Internet',
    novaEonModal: 'NOVA EON TV',
    healthModal: 'Προσφορά Υγείας',
    gprotasisModal: 'GProtasis',
});

let pageScrollY = 0;
let imagePreviewZoom = 1;
let imagePreviewPinchDistance = 0;
let imagePreviewPinchZoom = 1;
let imagePreviewDragging = false;
let imagePreviewDragStartX = 0;
let imagePreviewDragStartY = 0;
let imagePreviewDragScrollLeft = 0;
let imagePreviewDragScrollTop = 0;
let swipeBackStartX = 0;
let swipeBackStartY = 0;
let swipeBackStartTime = 0;
let swipeBackTracking = false;
const activeOfferViews = {};
const offerCardViewStarts = new Map();
const offerCardViewed = new Set();
let trackedOfferCards = [];

function loadAllTracking() {
    if (window.trackingLoaded) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
    };

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { 'anonymize_ip': true });
    window.trackingLoaded = true;
}

function hasAnalyticsConsent() {
    return localStorage.getItem('cookieConsent') === 'accepted';
}

function trackEvent(category, action, label, params = {}) {
    if (hasAnalyticsConsent() && typeof window.gtag === 'function') {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            ...params,
        });
    }
}

function getOfferName(modalId) {
    return TRACKED_OFFERS[modalId] || '';
}

function getOpenOfferContext() {
    const openOffer = Object.keys(TRACKED_OFFERS).find((modalId) => {
        const modal = document.getElementById(modalId);
        return modal && !modal.classList.contains('hidden');
    });

    return openOffer ? { offer_id: openOffer, offer_name: getOfferName(openOffer) } : {};
}


function getOpenTrackedModalId() {
    return Object.keys(TRACKED_OFFERS).find((modalId) => {
        const modal = document.getElementById(modalId);
        return modal && !modal.classList.contains('hidden');
    }) || '';
}

function closeSidebarInstantly() {
    const menu = document.getElementById('sidebarMenu');
    const overlay = document.getElementById('sidebarOverlay');

    if (menu) menu.classList.add('-translate-x-full');
    if (overlay) {
        overlay.classList.add('opacity-0');
        overlay.classList.add('hidden');
    }
}

function goHomeFromHeader() {
    const preview = document.getElementById('imagePreviewModal');

    document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach((modal) => {
        if (modal.id) stopOfferView(modal.id);
        modal.classList.add('hidden');
    });

    if (preview) {
        preview.classList.add('hidden');
        stopImagePreviewDrag();
        resetImagePreviewZoom(false);
    }

    closeSidebarInstantly();

    if (window.location.hash) {
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    unlockPageScrollIfIdle();

    requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        refreshVisibleOfferCards();
    });

    trackEvent('Navigation', 'header_home_click', 'top_bar');
}

function getFileName(path) {
    return (path || '').split('/').pop() || path || 'unknown';
}

function startOfferView(modalId, options = {}) {
    const offerName = getOfferName(modalId);
    if (!offerName || activeOfferViews[modalId]) return;

    activeOfferViews[modalId] = Date.now();
    if (options.trackOpen !== false) {
        trackEvent('Offer Engagement', 'offer_open', offerName, {
            offer_id: modalId,
            offer_name: offerName,
        });
    }
}

function stopOfferView(modalId, options = {}) {
    const offerName = getOfferName(modalId);
    const startedAt = activeOfferViews[modalId];
    if (!offerName || !startedAt) return;

    const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    delete activeOfferViews[modalId];

    trackEvent('Offer Engagement', 'offer_close', offerName, {
        offer_id: modalId,
        offer_name: offerName,
        engagement_time_sec: seconds,
        ...(options.beacon ? { transport_type: 'beacon' } : {}),
    });

    if (seconds > 0) {
        trackEvent('Offer Engagement', 'offer_time_spent', offerName, {
            offer_id: modalId,
            offer_name: offerName,
            engagement_time_sec: seconds,
            value: seconds,
            ...(options.beacon ? { transport_type: 'beacon' } : {}),
        });
    }
}

function stopAllOfferViews(options = {}) {
    Object.keys(activeOfferViews).forEach((modalId) => stopOfferView(modalId, options));
}

function resumeOpenOfferViews() {
    Object.keys(TRACKED_OFFERS).forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (modal && !modal.classList.contains('hidden')) startOfferView(modalId, { trackOpen: false });
    });
}

function getOfferCardContext(card) {
    const modalId = card?.dataset?.modalTarget;
    const offerName = getOfferName(modalId);
    return offerName ? { offer_id: modalId, offer_name: offerName } : null;
}

function startOfferCardView(card) {
    const context = getOfferCardContext(card);
    if (!context || offerCardViewStarts.has(card) || hasOpenBlockingLayer()) return;
    offerCardViewStarts.set(card, Date.now());
}

function stopOfferCardView(card, options = {}) {
    const context = getOfferCardContext(card);
    const startedAt = offerCardViewStarts.get(card);
    if (!context || !startedAt) return;

    offerCardViewStarts.delete(card);
    const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    if (seconds < MIN_CARD_VIEW_SECONDS) return;

    if (!offerCardViewed.has(context.offer_id)) {
        offerCardViewed.add(context.offer_id);
        trackEvent('Offer Engagement', 'offer_card_view', context.offer_name, context);
    }

    trackEvent('Offer Engagement', 'offer_card_time_spent', context.offer_name, {
        ...context,
        engagement_time_sec: seconds,
        value: seconds,
        ...(options.beacon ? { transport_type: 'beacon' } : {}),
    });
}

function stopAllOfferCardViews(options = {}) {
    Array.from(offerCardViewStarts.keys()).forEach((card) => stopOfferCardView(card, options));
}

function isElementMostlyVisible(element) {
    const rect = element.getBoundingClientRect();
    const visibleWidth = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    const visibleArea = Math.max(0, visibleWidth) * Math.max(0, visibleHeight);
    const totalArea = Math.max(1, rect.width * rect.height);
    return visibleArea / totalArea >= 0.5;
}

function refreshVisibleOfferCards() {
    if (hasOpenBlockingLayer()) return;
    trackedOfferCards.forEach((card) => {
        if (isElementMostlyVisible(card)) startOfferCardView(card);
        else stopOfferCardView(card);
    });
}

function initializeOfferCardTracking() {
    trackedOfferCards = Array.from(document.querySelectorAll('#offers-grid [data-modal-target]'));
    if (!trackedOfferCards.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.intersectionRatio >= 0.5) startOfferCardView(entry.target);
            else stopOfferCardView(entry.target);
        });
    }, { threshold: [0, 0.5] });

    trackedOfferCards.forEach((card) => observer.observe(card));
    refreshVisibleOfferCards();
}

function trackLinkClick(link) {
    const href = link.getAttribute('href') || '';
    const context = getOpenOfferContext();

    if (href.startsWith('assets/docs/')) {
        const documentName = getFileName(href);
        trackEvent('Documents', 'pdf_download', documentName, {
            ...context,
            document_name: documentName,
        });
        return;
    }

    if (href.startsWith('tel:')) {
        trackEvent('Contact', 'contact_click', 'phone', {
            ...context,
            contact_type: 'phone',
        });
        return;
    }

    if (href.startsWith('mailto:')) {
        trackEvent('Contact', 'contact_click', 'email', {
            ...context,
            contact_type: 'email',
        });
        return;
    }

    if (href.includes('invite.viber.com')) {
        trackEvent('Community', 'viber_click', 'Viber Community', {
            destination: 'viber_community',
        });
    }
}

/* =========================================
   2. UI FUNCTIONS (MODALS, TOASTS, TABS)
   ========================================= */

// Ειδοποιήσεις (Toasts) - Απαραίτητο για την αντιγραφή IBAN
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success'
        ? '<i class="fa-solid fa-circle-check text-green-400"></i>'
        : '<i class="fa-solid fa-circle-info text-blue-400"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function hasOpenBlockingLayer() {
    const sidebar = document.getElementById('sidebarMenu');
    const preview = document.getElementById('imagePreviewModal');

    return Boolean(
        document.querySelector('.modal-backdrop:not(.hidden)') ||
        (preview && !preview.classList.contains('hidden')) ||
        (sidebar && !sidebar.classList.contains('-translate-x-full'))
    );
}

function lockPageScroll() {
    if (document.body.dataset.scrollLocked === 'true') return;
    pageScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.dataset.scrollLocked = 'true';
    document.body.classList.add('overflow-hidden');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${pageScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
}

function unlockPageScrollIfIdle() {
    if (hasOpenBlockingLayer() || document.body.dataset.scrollLocked !== 'true') return;

    document.body.classList.remove('overflow-hidden', 'scroll-locked');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.removeAttribute('data-scroll-locked');
    window.scrollTo(0, pageScrollY);
}

function loadDeferredIframes(root) {
    root.querySelectorAll('iframe[data-src]').forEach((iframe) => {
        if (!iframe.getAttribute('src')) {
            iframe.setAttribute('src', iframe.dataset.src);
        }
    });
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function openModal(id, updateHistory = true) {
    const modal = document.getElementById(id);
    if (!modal) return;
    const wasHidden = modal.classList.contains('hidden');

    if (wasHidden) stopAllOfferCardViews();
    modal.classList.remove('hidden');
    loadDeferredIframes(modal); activateVisibleProcessWizard(modal);
    if (wasHidden) {
        lockPageScroll();
        startOfferView(id);
    }
    
    if (updateHistory && window.location.hash !== `#${id}`) {
        history.pushState({ screen: 'offer', modalId: id }, '', `#${id}`);
    }
}

function openModalFromHash() {
    const modalId = decodeURIComponent(window.location.hash.replace('#', ''));
    if (!modalId) return;

    const modal = document.getElementById(modalId);
    if (modal && modal.classList.contains('modal-backdrop')) {
        openModal(modalId, false);
    }
}

function closeModal(id, updateHistory = true) {
    const modal = document.getElementById(id);
    const wasOpen = modal && !modal.classList.contains('hidden');
    if (modal) modal.classList.add('hidden');
    if (wasOpen) stopOfferView(id);
        if (id === 'imagePreviewModal') {
        stopImagePreviewDrag();
        resetImagePreviewZoom(false);

        if (wasOpen && history.state && (history.state.imagePreview || history.state.screen === 'image-preview')) {
            history.back();
            return;
        }
    }
    
   if (updateHistory && window.location.hash === `#${id}`) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

    if (wasOpen) {
        unlockPageScrollIfIdle();
        if (!hasOpenBlockingLayer()) requestAnimationFrame(refreshVisibleOfferCards);
    }

    if (!hasOpenBlockingLayer()) {
    }
}

function toggleSidebar() {
  const menu = document.getElementById('sidebarMenu');
  const overlay = document.getElementById('sidebarOverlay');

  if (!menu || !overlay) return;

  const isClosed = menu.classList.contains('-translate-x-full');

  if (isClosed) {
    overlay.classList.remove('hidden');

    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      menu.classList.remove('-translate-x-full');
    });
  } else {
    menu.classList.add('-translate-x-full');
    overlay.classList.add('opacity-0');

    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 300);
  }
}

function openImagePreview(imgName, updateHistory = true) {
    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('previewImageTarget');
    if (!modal || !img) return;
    
    img.onload = () => {
        resetImagePreviewZoom(false);
        storeImagePreviewBaseWidth();
    };
    img.src = imgName;
    modal.classList.remove('hidden');
    lockPageScroll();

    if (updateHistory) {
        history.pushState({
            screen: 'image-preview',
            imagePreview: true,
            previewSrc: imgName,
            parentModalId: getOpenTrackedModalId(),
        }, '', window.location.href);
    }
    trackEvent('Documents', 'document_preview_open', getFileName(imgName), {
        ...getOpenOfferContext(),
        document_name: getFileName(imgName),
    });
    resetImagePreviewZoom(false);
    requestAnimationFrame(storeImagePreviewBaseWidth);
}

function storeImagePreviewBaseWidth() {
    const img = document.getElementById('previewImageTarget');
    if (!img) return;

    img.style.width = '';
    img.style.maxWidth = 'min(94vw, 1100px)';
    img.style.maxHeight = '86dvh';

    requestAnimationFrame(() => {
        const width = img.getBoundingClientRect().width;
        if (width > 0) img.dataset.baseWidth = String(width);
    });
}

function updateImagePreviewZoom() {
    const img = document.getElementById('previewImageTarget');
    const viewport = document.getElementById('imagePreviewViewport');
    const label = document.getElementById('imagePreviewZoomLabel');
    if (!img) return;

    if (imagePreviewZoom <= IMAGE_PREVIEW_MIN_ZOOM) {
        img.style.width = '';
        img.style.maxWidth = 'min(94vw, 1100px)';
        img.style.maxHeight = '86dvh';
        img.style.cursor = 'zoom-in';
        if (viewport) viewport.classList.remove('is-zoomed', 'is-dragging');
    } else {
        const baseWidth = Number(img.dataset.baseWidth) || img.getBoundingClientRect().width || img.naturalWidth;
        img.style.width = `${baseWidth * imagePreviewZoom}px`;
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.cursor = 'grab';
        if (viewport) viewport.classList.add('is-zoomed');
    }

    if (label) label.textContent = `${Math.round(imagePreviewZoom * 100)}%`;
}

function zoomImagePreview(amount) {
    const viewport = document.getElementById('imagePreviewViewport');
    const wasAtMinimum = imagePreviewZoom <= IMAGE_PREVIEW_MIN_ZOOM;

    imagePreviewZoom = clamp(imagePreviewZoom + amount, IMAGE_PREVIEW_MIN_ZOOM, IMAGE_PREVIEW_MAX_ZOOM);
    updateImagePreviewZoom();

    if (viewport && wasAtMinimum && imagePreviewZoom > IMAGE_PREVIEW_MIN_ZOOM) {
        requestAnimationFrame(() => {
            viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
            viewport.scrollTop = 0;
        });
    }
}

function resetImagePreviewZoom(scrollToTop = true) {
    imagePreviewZoom = 1;
    updateImagePreviewZoom();

    if (scrollToTop) {
        const viewport = document.getElementById('imagePreviewViewport');
        if (viewport) viewport.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
}

function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
}

function handleImagePreviewWheel(event) {
    const modal = document.getElementById('imagePreviewModal');
    if (!modal || modal.classList.contains('hidden')) return;

    event.preventDefault();
    zoomImagePreview(event.deltaY < 0 ? 0.25 : -0.25);
}

function handleImagePreviewTouchStart(event) {
    if (event.touches.length !== 2) return;
    stopImagePreviewDrag();
    imagePreviewPinchDistance = getTouchDistance(event.touches);
    imagePreviewPinchZoom = imagePreviewZoom;
}

function handleImagePreviewTouchMove(event) {
    if (event.touches.length !== 2 || imagePreviewPinchDistance <= 0) return;
    event.preventDefault();

    const currentDistance = getTouchDistance(event.touches);
    imagePreviewZoom = clamp(
        imagePreviewPinchZoom * (currentDistance / imagePreviewPinchDistance),
        IMAGE_PREVIEW_MIN_ZOOM,
        IMAGE_PREVIEW_MAX_ZOOM
    );
    updateImagePreviewZoom();
}

function handleImagePreviewTouchEnd() {
    imagePreviewPinchDistance = 0;
}

function stopImagePreviewDrag() {
    const viewport = document.getElementById('imagePreviewViewport');
    imagePreviewDragging = false;
    if (viewport) viewport.classList.remove('is-dragging');
}

function handleImagePreviewPointerDown(event) {
    const viewport = document.getElementById('imagePreviewViewport');
    if (!viewport || imagePreviewZoom <= IMAGE_PREVIEW_MIN_ZOOM || event.button > 0) return;

    imagePreviewDragging = true;
    imagePreviewDragStartX = event.clientX;
    imagePreviewDragStartY = event.clientY;
    imagePreviewDragScrollLeft = viewport.scrollLeft;
    imagePreviewDragScrollTop = viewport.scrollTop;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture?.(event.pointerId);
}

function handleImagePreviewPointerMove(event) {
    const viewport = document.getElementById('imagePreviewViewport');
    if (!viewport || !imagePreviewDragging) return;

    event.preventDefault();
    viewport.scrollLeft = imagePreviewDragScrollLeft - (event.clientX - imagePreviewDragStartX);
    viewport.scrollTop = imagePreviewDragScrollTop - (event.clientY - imagePreviewDragStartY);
}

function handleImagePreviewPointerUp(event) {
    const viewport = document.getElementById('imagePreviewViewport');
    if (viewport) viewport.releasePointerCapture?.(event.pointerId);
    stopImagePreviewDrag();
}


function resetSwipeBackTracking() {
    swipeBackTracking = false;
    swipeBackStartX = 0;
    swipeBackStartY = 0;
    swipeBackStartTime = 0;
}

function isImagePreviewOpen() {
    const modal = document.getElementById('imagePreviewModal');
    return Boolean(modal && !modal.classList.contains('hidden'));
}

function shouldIgnoreSwipeBackTarget(target) {
    if (!target || !target.closest) return false;

    if (target.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"]')) {
        return true;
    }

    if (target.closest('[data-preview-zoom], [data-preview-reset], [data-copy-text], [data-copy-iban], [data-tab-show]')) {
        return true;
    }

    let node = target;
    while (node && node !== document.body) {
        if (node.scrollWidth > node.clientWidth + 12) {
            const style = window.getComputedStyle(node);
            if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
                return true;
            }
        }

        node = node.parentElement;
    }

    return false;
}

function handleSwipeBackTouchStart(event) {
    if (!event.touches || event.touches.length !== 1) {
        resetSwipeBackTracking();
        return;
    }

    if (imagePreviewPinchDistance > 0 || imagePreviewDragging || (isImagePreviewOpen() && imagePreviewZoom > 1)) {
        resetSwipeBackTracking();
        return;
    }

    if (shouldIgnoreSwipeBackTarget(event.target)) {
        resetSwipeBackTracking();
        return;
    }

    const touch = event.touches[0];

    if (touch.clientX <= SWIPE_BACK_EDGE_GUARD || touch.clientX >= window.innerWidth - SWIPE_BACK_EDGE_GUARD) {
        resetSwipeBackTracking();
        return;
    }

    swipeBackStartX = touch.clientX;
    swipeBackStartY = touch.clientY;
    swipeBackStartTime = Date.now();
    swipeBackTracking = true;
}

function handleProcessWizardSwipeBack() {
    if (
        typeof PROCESS_WIZARDS === 'undefined' ||
        typeof processWizardState === 'undefined' ||
        typeof showProcessWizardStep !== 'function'
    ) {
        return false;
    }

    const activeProcess = Array.from(document.querySelectorAll('#v-port, #v-new, #n-port, #n-new')).find((element) => {
        const modal = element.closest('.modal-backdrop');

        return modal &&
            !modal.classList.contains('hidden') &&
            !element.classList.contains('hidden') &&
            PROCESS_WIZARDS[element.id];
    });

    if (!activeProcess) return false;

    const currentIndex = processWizardState[activeProcess.id] || 0;

    if (currentIndex > 0) {
        showProcessWizardStep(activeProcess.id, currentIndex - 1);
        return true;
    }

    const currentModal = activeProcess.closest('.modal-backdrop');
    const choiceModalId = activeProcess.id.startsWith('v-') ? 'vodaChoiceModal' : 'novaChoiceModal';

    if (currentModal && document.getElementById(choiceModalId)) {
        closeModal(currentModal.id, false);
        openModal(choiceModalId);
        return true;
    }

    return false;
}

function handleSwipeBackTouchEnd(event) {
    if (!swipeBackTracking || !event.changedTouches || event.changedTouches.length !== 1) {
        resetSwipeBackTracking();
        return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeBackStartX;
    const deltaY = Math.abs(touch.clientY - swipeBackStartY);
    const duration = Date.now() - swipeBackStartTime;

    resetSwipeBackTracking();

    if (
        deltaX >= SWIPE_BACK_MIN_DISTANCE &&
        deltaY <= SWIPE_BACK_MAX_VERTICAL_DISTANCE &&
        duration <= SWIPE_BACK_MAX_DURATION_MS
    ) {
        trackEvent('Navigation', 'swipe_back', 'touch_gesture', {
            direction: 'right',
        });

        if (handleProcessWizardSwipeBack()) {
        return;
    }

    window.history.back();
    }
}


const PROCESS_WIZARDS = Object.freeze({
    'v-port': { title: 'Vodafone CU', subtitle: 'Φορητότητα', color: 'red' },
    'v-new': { title: 'Vodafone CU', subtitle: 'Νέος αριθμός', color: 'red' },
    'n-port': { title: 'NOVA Q', subtitle: 'Φορητότητα', color: 'orange' },
    'n-new': { title: 'NOVA Q', subtitle: 'Νέος αριθμός', color: 'orange' },
});

const processWizardState = {};
function getProcessWizardTheme(color) {
    if (color === 'blue') {
        return {
            border: 'border-blue-100',
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            button: 'bg-blue-600 hover:bg-blue-700',
            dotActive: 'bg-blue-600',
            dotInactive: 'bg-slate-300',
        };
    }

    if (color === 'orange') {
        return {
            border: 'border-orange-100',
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            button: 'bg-orange-500 hover:bg-orange-600',
            dotActive: 'bg-orange-500',
            dotInactive: 'bg-slate-300',
        };
    }

    return {
        border: 'border-red-100',
        bg: 'bg-red-50',
        text: 'text-red-700',
        button: 'bg-red-600 hover:bg-red-700',
        dotActive: 'bg-red-600',
        dotInactive: 'bg-slate-300',
    };
}

function makeEl(tag, className = '', text = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

function getProcessTimeline(container) {
    return Array.from(container.children).find((child) => child.classList.contains('relative'));
}

function getProcessSteps(container) {
    return Array.from(container.querySelectorAll('[data-process-step]'));
}

function getProcessStepTitle(step, index) {
    return step.dataset.stepTitle || `Βήμα ${index + 1}`;
}

function moveDownloadBlockToPreparation(container, firstStep) {
    if (!container || !firstStep) return;
    if (firstStep.querySelector('[data-downloads-moved="true"]')) return;

    const downloadBlocks = Array.from(container.querySelectorAll('div, section, footer')).filter((element) => {
        if (element === container || firstStep.contains(element)) return false;

        const text = element.textContent.replace(/\s+/g, ' ').trim();

        return (
            text.includes('Κατεβάστε τα') ||
            text.includes('Κατεβάστε το') ||
            text.includes('Κατεβάστε την')
        ) && element.querySelector('a[href]');
    });

    if (!downloadBlocks.length) return;

    const downloadBlock = downloadBlocks.sort((a, b) => a.textContent.length - b.textContent.length)[0];
    const preparationCard = firstStep.querySelector('h4')?.parentElement || firstStep;

    downloadBlock.dataset.downloadsMoved = 'true';
    downloadBlock.classList.remove('sticky', 'bottom-0', 'z-20');
    downloadBlock.classList.add('mt-5', 'pt-4', 'border-t', 'border-slate-100');

    downloadBlock.innerHTML = downloadBlock.innerHTML
        .replaceAll('Κατεβάστε τα 3 απαραίτητα εντυπα:', 'Κατέβασε τα έγγραφα:')
        .replaceAll('Κατεβάστε τα 2 απαραίτητα εντυπα:', 'Κατέβασε τα έγγραφα:')
        .replaceAll('Κατεβάστε το 1 απαραίτητο εντυπο:', 'Κατέβασε το έγγραφο:')
        .replaceAll('Κατεβάστε τα 3 απαραίτητα έντυπα:', 'Κατέβασε τα έγγραφα:')
        .replaceAll('Κατεβάστε τα 2 απαραίτητα έντυπα:', 'Κατέβασε τα έγγραφα:')
        .replaceAll('Κατεβάστε το 1 απαραίτητο έντυπο:', 'Κατέβασε το έγγραφο:');

    const documentLinks = Array.from(downloadBlock.querySelectorAll('a[href]'));

    downloadBlock.textContent = '';
    downloadBlock.className = 'mt-5 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 shadow-sm';
    downloadBlock.dataset.downloadsMoved = 'true';

    const downloadTitle = makeEl(
        'p',
        'text-sm font-black text-amber-900 mb-3 flex items-center gap-2',
        'Πρώτα κατέβασε και συμπλήρωσε αυτά:'
    );

    const downloadIcon = document.createElement('i');
    downloadIcon.className = 'fa-solid fa-download text-amber-600';
    downloadTitle.prepend(downloadIcon);

    const linksGrid = makeEl(
        'div',
        'flex flex-wrap justify-center items-start gap-4'
    );

    documentLinks.forEach((link) => {
        link.classList.remove('text-xs', 'w-full', 'min-h-[46px]');
        link.classList.add(
            'w-[150px]',
            'h-[150px]',
            'flex',
            'flex-col',
            'items-center',
            'justify-center',
            'text-center',
            'text-[11px]',
            'md:text-xs',
            'shadow-sm',
            'rounded-full'
        );

        linksGrid.appendChild(link);
    });

    const nextHint = makeEl(
        'p',
        'mt-3 text-xs font-bold text-slate-600',
        'Μετά πάτα “Επόμενο”.'
    );

    downloadBlock.appendChild(downloadTitle);
    downloadBlock.appendChild(linksGrid);
    downloadBlock.appendChild(nextHint);

    preparationCard.appendChild(downloadBlock);
}

function createProcessWizard(containerId, config, theme, steps) {
    const isVoda = containerId.startsWith('v-');
    const modalId = isVoda ? 'vodaModal' : 'novaModal';
    const choiceModalId = isVoda ? 'vodaChoiceModal' : 'novaChoiceModal';

    const companyBadgeClass = isVoda
        ? 'bg-red-600 text-white border-red-300'
        : 'bg-orange-500 text-blue-700 border-orange-300';

    const closeButtonClass = isVoda
        ? 'w-10 h-10 rounded-full bg-red-600 text-white text-2xl font-black flex items-center justify-center hover:bg-red-700 transition border-2 border-red-300 shadow-md'
        : 'w-10 h-10 rounded-full bg-orange-100 text-blue-700 text-2xl font-black flex items-center justify-center hover:bg-orange-200 transition border-2 border-orange-300 shadow-md';

    const wizard = makeEl(
        'div',
        `mb-4 rounded-2xl border ${theme.border} ${theme.bg} p-3 md:p-5 shadow-sm`
    );

    wizard.dataset.processWizard = 'true';
    wizard.dataset.processContainer = containerId;

    const header = makeEl(
        'div',
        'flex items-start justify-between gap-3 mb-3'
    );

    const left = makeEl('div', 'min-w-0');

    const label = makeEl(
        'p',
        'text-[10px] md:text-xs font-black uppercase tracking-[0.18em] text-slate-500',
        'ΟΔΗΓΟΣ ΕΝΕΡΓΟΠΟΙΗΣΗΣ'
    );

    const stepTitle = makeEl(
        'h4',
        'mt-1 text-base md:text-lg font-black text-slate-900 leading-tight'
    );
    stepTitle.dataset.processStepTitle = '';
    stepTitle.textContent = getProcessStepTitle(steps[0], 0);

    left.appendChild(label);
    left.appendChild(stepTitle);

    const right = makeEl('div', 'flex items-center gap-2 shrink-0');

    const companyBadge = makeEl(
        'span',
        `hidden sm:inline-flex rounded-full px-3 py-1 text-xs font-black border-2 shadow-sm ${companyBadgeClass}`,
        config.title
    );
    companyBadge.dataset.processMainTitle = '';

    const closeButton = makeEl(
        'button',
        closeButtonClass,
        '×'
    );
    closeButton.type = 'button';
    closeButton.dataset.modalClose = modalId;
    closeButton.dataset.modalTarget = choiceModalId;
    closeButton.setAttribute('aria-label', 'Πίσω στην επιλογή διαδικασίας');

    right.appendChild(companyBadge);
    right.appendChild(closeButton);

    header.appendChild(left);
    header.appendChild(right);

    const mobileBadge = makeEl(
        'div',
        `sm:hidden inline-flex w-fit rounded-full px-3 py-1 text-xs font-black border-2 shadow-sm mb-3 ${companyBadgeClass}`,
        config.title
    );

    const counter = makeEl(
        'div',
        'mb-3 text-xs md:text-sm font-black text-slate-500'
    );

    counter.append('Βήμα ');
    const current = makeEl('span', '', '1');
    current.dataset.processCurrent = '';
    counter.appendChild(current);

    counter.append(' από ');

    const total = makeEl('span', '', String(steps.length));
    total.dataset.processTotal = '';
    counter.appendChild(total);

    const dots = makeEl(
        'div',
        'flex items-center gap-2 md:gap-3'
    );
    dots.dataset.processDots = '';

    wizard.appendChild(header);
    wizard.appendChild(mobileBadge);
    wizard.appendChild(counter);
    wizard.appendChild(dots);

    return wizard;
}

function buildProcessMailtoHref(config) {
    const subject = `Δικαιολογητικά ${config.title} - ${config.subtitle}`;
    const body = `Καλησπέρα σας,

Σας αποστέλλω τα απαραίτητα δικαιολογητικά για ${config.title} - ${config.subtitle}.

Ονοματεπώνυμο:
Τηλέφωνο επικοινωνίας:`;

    return `mailto:synetelas2011@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function enhanceProcessEmailActions(container, config) {
    if (!container || !config) return;

    const steps = getProcessSteps(container);

    steps.forEach((step) => {
        if (!step.textContent.includes('synetelas2011@gmail.com')) return;
        if (step.querySelector('[data-email-actions="true"]')) return;

        const card = step.querySelector('h4')?.parentElement || step;

        const emailBox = makeEl(
            'div',
            'mt-4 rounded-2xl border-2 border-sky-100 bg-sky-50 p-4 shadow-sm'
        );
        emailBox.dataset.emailActions = 'true';

        const title = makeEl(
            'p',
            'text-sm font-black text-sky-900 mb-3 flex items-center gap-2',
            'Αποστολή δικαιολογητικών'
        );

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-envelope-open-text text-sky-600';
        title.prepend(icon);

        const emailText = makeEl(
            'p',
            'text-xs font-bold text-slate-600 mb-3',
            'Χρησιμοποίησε τα παρακάτω κουμπιά για να αποφύγεις λάθη στο email.'
        );

        const actions = makeEl('div', 'grid grid-cols-1 sm:grid-cols-2 gap-2');

        const copyButton = makeEl(
            'button',
            'inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-sky-200 px-4 py-3 text-xs font-black text-sky-700 hover:bg-sky-100 transition',
            'Αντιγραφή Email'
        );
        copyButton.type = 'button';
        copyButton.dataset.copyEmail = 'synetelas2011@gmail.com';

        const copyIcon = document.createElement('i');
        copyIcon.className = 'fa-solid fa-copy';
        copyButton.prepend(copyIcon);

        const openEmail = makeEl(
            'a',
            'inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-xs font-black text-white hover:bg-sky-700 transition shadow-sm',
            'Άνοιγμα Email'
        );
        openEmail.href = buildProcessMailtoHref(config);

        const openIcon = document.createElement('i');
        openIcon.className = 'fa-solid fa-paper-plane';
        openEmail.prepend(openIcon);

        actions.appendChild(copyButton);
        actions.appendChild(openEmail);

        emailBox.appendChild(title);
        emailBox.appendChild(emailText);
        emailBox.appendChild(actions);

        card.appendChild(emailBox);
    });
}


function ensureProcessWizard(containerId) {
    const container = document.getElementById(containerId);
    const config = PROCESS_WIZARDS[containerId];

    if (!container || !config) return;

    const steps = getProcessSteps(container);
    if (!steps.length) return;

    moveDownloadBlockToPreparation(container, steps[0]);
    enhanceProcessEmailActions(container, config);

    const theme = getProcessWizardTheme(config.color);
    const timeline = getProcessTimeline(container);

    if (timeline) {
        const verticalLine = Array.from(timeline.children).find((child) => child.classList.contains('absolute'));
        if (verticalLine) verticalLine.classList.add('hidden');
    }

    let wizard = Array.from(container.children).find((child) => child.dataset.processWizard === 'true');

    if (!wizard) {
        wizard = createProcessWizard(containerId, config, theme, steps);
        container.prepend(wizard);
    }

    const mainTitle = wizard.querySelector('[data-process-main-title]');
    const subtitle = wizard.querySelector('[data-process-subtitle]');
    const total = wizard.querySelector('[data-process-total]');

    if (mainTitle) mainTitle.textContent = config.title;
    if (subtitle) subtitle.textContent = config.subtitle;
    if (total) total.textContent = steps.length;

    showProcessWizardStep(containerId, processWizardState[containerId] || 0);
}

function updateProcessHeaderStep(containerId, stepIndex, totalSteps, stepTitle) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const titleElement = container.querySelector('[data-process-title]');
    if (!titleElement) return;

    titleElement.textContent = `Βήμα ${stepIndex + 1}/${totalSteps} · ${stepTitle}`;
}

function showProcessWizardStep(containerId, index) {
    const container = document.getElementById(containerId);
    const config = PROCESS_WIZARDS[containerId];

    if (!container || !config) return;

    const steps = getProcessSteps(container);
    if (!steps.length) return;

    const theme = getProcessWizardTheme(config.color);
    const safeIndex = Math.min(Math.max(index, 0), steps.length - 1);

    processWizardState[containerId] = safeIndex;

    steps.forEach((step, stepIndex) => {
        step.classList.toggle('hidden', stepIndex !== safeIndex);
    });

    const wizard = container.querySelector('[data-process-wizard]');
    if (!wizard) return;

    const current = wizard.querySelector('[data-process-current]');
    const stepTitle = wizard.querySelector('[data-process-step-title]');
    const currentStepTitle = getProcessStepTitle(steps[safeIndex], safeIndex);

    if (current) current.textContent = safeIndex + 1;
    if (stepTitle) stepTitle.textContent = currentStepTitle;

    updateProcessHeaderStep(containerId, safeIndex, steps.length, currentStepTitle);

    const dots = wizard.querySelector('[data-process-dots]');
    const prev = container.querySelector('[data-process-prev]');
    const next = container.querySelector('[data-process-next]');

    if (dots) {
        dots.innerHTML = '';

        steps.forEach((_, dotIndex) => {
            const dot = makeEl(
                'span',
                `h-2 flex-1 rounded-full ${dotIndex <= safeIndex ? theme.dotActive : theme.dotInactive}`
            );
            dots.appendChild(dot);
        });
    }

    if (prev) prev.disabled = safeIndex === 0;

    if (next) {
        next.disabled = safeIndex === steps.length - 1;
        next.textContent = safeIndex === steps.length - 1 ? 'Τέλος' : 'Επόμενο';
    }
}

function resetProcessWizard(containerId) {
    if (!PROCESS_WIZARDS[containerId]) return;

    processWizardState[containerId] = 0;
    ensureProcessWizard(containerId);
    showProcessWizardStep(containerId, 0);
}

function activateVisibleProcessWizard(root) {
    if (!root) return;

    const activeProcess = Array.from(root.querySelectorAll('#v-port, #v-new, #n-port, #n-new')).find((element) => {
        return !element.classList.contains('hidden');
    });

    if (activeProcess) resetProcessWizard(activeProcess.id);
}


function handleDocumentClick(event) {

    const stopTarget = event.target.closest('[data-stop-click]');
    if (stopTarget) event.stopPropagation();

    const linkTarget = event.target.closest('a[href]');
    if (linkTarget) trackLinkClick(linkTarget);

    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) {
        const action = actionTarget.dataset.action;

        if (action === 'go-home') {
            event.preventDefault();
            goHomeFromHeader();
            return;
        }

        if (action === 'toggle-sidebar') {
            event.preventDefault();
            toggleSidebar();
            return;
        }
    }

    const cookieTarget = event.target.closest('[data-cookie-consent]');
    if (cookieTarget) {
        event.preventDefault();
        handleCookieConsent(cookieTarget.dataset.cookieConsent);
        return;
    }

    const previewSourceTarget = event.target.closest('[data-preview-src]');
    if (previewSourceTarget) {
        event.preventDefault();
        openImagePreview(previewSourceTarget.dataset.previewSrc);
        return;
    }

    const previewZoomTarget = event.target.closest('[data-preview-zoom]');
    if (previewZoomTarget) {
        event.preventDefault();
        zoomImagePreview(Number(previewZoomTarget.dataset.previewZoom));
        return;
    }

    const previewResetTarget = event.target.closest('[data-preview-reset]');
    if (previewResetTarget) {
        event.preventDefault();
        resetImagePreviewZoom();
        return;
    }

    const copyEmailTarget = event.target.closest('[data-copy-email]');
    if (copyEmailTarget) {
        event.preventDefault();

        if (typeof copyToClipboard === 'function') {
            copyToClipboard(copyEmailTarget.dataset.copyEmail, copyEmailTarget);
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(copyEmailTarget.dataset.copyEmail);
            copyEmailTarget.textContent = 'Αντιγράφηκε!';
        }

        return;
    }

    const copyTextTarget = event.target.closest('[data-copy-text]');
    if (copyTextTarget) {
        event.preventDefault();
        trackEvent('Payments', 'payment_copy', 'account_name', {
            ...getOpenOfferContext(),
            copy_type: 'account_name',
        });
        copyToClipboard(copyTextTarget.dataset.copyText, copyTextTarget);
        return;
    }

    const copyIbanTarget = event.target.closest('[data-copy-iban]');
    if (copyIbanTarget) {
        event.preventDefault();
        trackEvent('Payments', 'payment_copy', 'iban', {
            ...getOpenOfferContext(),
            copy_type: 'iban',
        });
        copyIBAN(copyIbanTarget.dataset.copyIban, copyIbanTarget);
        return;
    }

    const processChangeChoiceTarget = event.target.closest('[data-process-change-choice]');
    if (processChangeChoiceTarget) {
        event.preventDefault();

        const wizard = processChangeChoiceTarget.closest('[data-process-wizard]');
        const containerId = wizard?.dataset.processContainer;
        const activeProcess = containerId ? document.getElementById(containerId) : null;
        const currentModal = activeProcess?.closest('.modal-backdrop');
        const choiceModalId = containerId?.startsWith('v-') ? 'vodaChoiceModal' : 'novaChoiceModal';

        if (currentModal && document.getElementById(choiceModalId)) {
            closeModal(currentModal.id, false);
            openModal(choiceModalId);
        }

        return;
    }

    const processWizardTarget = event.target.closest('[data-process-prev], [data-process-next]');
    if (processWizardTarget) {
        event.preventDefault();

        const wizard = processWizardTarget.closest('[data-process-wizard]');
        const containerId = wizard?.dataset.processContainer;

        if (!containerId) return;

        const currentIndex = processWizardState[containerId] || 0;
        const direction = processWizardTarget.matches('[data-process-next]') ? 1 : -1;

        showProcessWizardStep(containerId, currentIndex + direction);
        return;
    }

    const tabTarget = event.target.closest('[data-tab-show]');
    if (tabTarget) {
        event.preventDefault();
        trackEvent('Offer Engagement', 'offer_tab_switch', tabTarget.dataset.tabShow, {
            ...getOpenOfferContext(),
            tab_show: tabTarget.dataset.tabShow,
        });
        switchTab(
            tabTarget.dataset.tabShow,
            tabTarget.dataset.tabHide,
            tabTarget.dataset.tabActive,
            tabTarget.dataset.tabInactive
        );
        return;
    }

    const sidebarTarget = event.target.closest('[data-sidebar-target]');
    if (sidebarTarget) {
        event.preventDefault();
        const modalId = sidebarTarget.dataset.sidebarTarget;
        toggleSidebar();
        setTimeout(() => openModal(modalId), 300);
        return;
    }

   const modalCloseTarget = event.target.closest('[data-modal-close]');
if (modalCloseTarget) {
    event.preventDefault();

    const modalToClose = modalCloseTarget.dataset.modalClose;
    const modalToOpen = modalCloseTarget.dataset.modalTarget;

    closeModal(modalToClose);

    if (modalToOpen) {
        openModal(modalToOpen);

        if (
            modalCloseTarget.dataset.openTabShow &&
            modalCloseTarget.dataset.openTabHide &&
            modalCloseTarget.dataset.openTabActive &&
            modalCloseTarget.dataset.openTabInactive
        ) {
            switchTab(
                modalCloseTarget.dataset.openTabShow,
                modalCloseTarget.dataset.openTabHide,
                modalCloseTarget.dataset.openTabActive,
                modalCloseTarget.dataset.openTabInactive
            );
        }
    }

    return;
}

    const modalTarget = event.target.closest('[data-modal-target]');
    if (modalTarget) {
        event.preventDefault();
        openModal(modalTarget.dataset.modalTarget);
        return;
    }

    if (event.target.classList.contains('modal-backdrop')) closeModal(event.target.id);
    if (event.target.id === 'sidebarOverlay') toggleSidebar();
    if (event.target.id === 'imagePreviewModal') {
        closeModal('imagePreviewModal');
    }
}

function handleDocumentKeydown(event) {
    if ((event.key !== 'Enter' && event.key !== ' ') || !event.target.matches('[role="button"][data-modal-target]')) {
        return;
    }

    event.preventDefault();
    openModal(event.target.dataset.modalTarget);
}

function updateProcessModalTitle(showId) {
    const titles = {
        'v-port': 'Οδηγός Vodafone CU - Φορητότητα',
        'v-new': 'Οδηγός Vodafone CU - Νέος αριθμός',
        'n-port': 'Οδηγός NOVA Q - Φορητότητα',
        'n-new': 'Οδηγός NOVA Q - Νέος αριθμός',
    };

    const titleId = showId.startsWith('v-') ? 'vodaProcessTitle' : 'novaProcessTitle';
    const titleElement = document.getElementById(titleId);

    if (titleElement && titles[showId]) {
        titleElement.textContent = titles[showId];
    }
}

function switchTab(showId, hideId, activeBtnId, inactiveBtnId) {
  const show = document.getElementById(showId);
  const hide = document.getElementById(hideId);
  const activeBtn = document.getElementById(activeBtnId);
  const inactiveBtn = document.getElementById(inactiveBtnId);

  if (!show || !hide || !activeBtn || !inactiveBtn) {
    console.warn('switchTab missing element', { showId, hideId, activeBtnId, inactiveBtnId });
    return;
  }

  show.classList.remove('hidden');
  hide.classList.add('hidden');

  const isVoda = activeBtnId.includes('v-') || activeBtnId === 'btn-v-port';

  if (isVoda) {
    inactiveBtn.className = "flex-1 py-3 md:py-4 font-bold text-xs md:text-sm text-gray-500 hover:bg-gray-100 transition";
    activeBtn.className = "flex-1 py-3 md:py-4 font-bold text-xs md:text-sm text-red-600 border-b-4 border-red-600 bg-white";
  } else {
    inactiveBtn.className = "flex-1 py-3 md:py-4 font-bold text-xs md:text-sm text-orange-700 bg-orange-100 hover:bg-orange-200 transition";
    activeBtn.className = "flex-1 py-3 md:py-4 font-bold text-xs md:text-sm text-white border-b-4 border-orange-700 bg-orange-500 hover:bg-orange-600 transition";
  }

  updateProcessModalTitle(showId);
  resetProcessWizard(showId);
}

/* =========================================
   3. COPY FUNCTIONS
   ========================================= */
function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy') ? resolve() : reject(new Error('Copy failed'));
        } catch (error) {
            reject(error);
        } finally {
            textarea.remove();
        }
    });
}

function copyToClipboard(text, element) {
    writeClipboard(text).then(() => {
        const msg = element.querySelector('.copy-msg');
        const icon = element.querySelector('.fa-copy');
        if (msg) { msg.classList.remove('opacity-0'); msg.classList.add('opacity-100'); }
        if (icon) {
            icon.classList.remove('fa-copy', 'fa-regular');
            icon.classList.add('fa-check', 'fa-solid');
        }
        setTimeout(() => {
            if (msg) { msg.classList.remove('opacity-100'); msg.classList.add('opacity-0'); }
            if (icon) {
                icon.classList.remove('fa-check', 'fa-solid');
                icon.classList.add('fa-copy', 'fa-regular');
            }
        }, 2000);
    }).catch(() => showToast('Η αντιγραφή απέτυχε', 'error'));
}

async function copyIBAN(text, element) {
    try {
        await writeClipboard(text);
        showToast('Ο αριθμός λογαριασμού αντιγράφηκε!', 'success');
        const iconCopy = element.querySelector('.icon-copy');
        const iconCheck = element.querySelector('.icon-check');
        if (iconCopy && iconCheck) { iconCopy.classList.add('hidden'); iconCheck.classList.remove('hidden'); }
        element.classList.add('border-green-500', 'bg-green-50');
        setTimeout(() => {
            if (iconCopy && iconCheck) { iconCopy.classList.remove('hidden'); iconCheck.classList.add('hidden'); }
            element.classList.remove('border-green-500', 'bg-green-50');
        }, 2000);
    } catch (err) {
        showToast('Η αντιγραφή απέτυχε', 'error');
    }
}

/* ========================================= 4.
COOKIE CONSENT ========================================= */ /* =========================================
   5. COOKIE CONSENT
   ========================================= */
function handleCookieConsent(action) {
    const banner = document.getElementById('cookieConsentBanner');
    if (!banner) return;
    if (action === 'accept') {
        localStorage.setItem('cookieConsent', 'accepted');
        loadAllTracking();
        trackEvent('Consent', 'analytics_consent_accept', 'Cookie Banner');
        showToast('Οι προτιμήσεις αποθηκεύτηκαν', 'success');
    } else {
        localStorage.setItem('cookieConsent', 'rejected');
        showToast('Τα cookies απορρίφθηκαν', 'info');
    }
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(100%)';
    setTimeout(() => banner.classList.add('hidden'), 500);
}

/* =========================================
   6. INITIALIZATION & ROUTING
   ========================================= */
let pageInitialized = false;


function formatGreekDateTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('el-GR', {
        timeZone: 'Europe/Athens',
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

async function loadSiteUpdateNotice() {
    const target = document.getElementById('siteLastUpdated');

    if (!target) return;

    try {
        const response = await fetch(`assets/site-version.json?v=${Date.now()}`, {
            cache: 'no-store',
        });

        if (!response.ok) throw new Error('site-version not available');

        const data = await response.json();
        const formatted = formatGreekDateTime(data.updatedAt);

        if (!formatted) throw new Error('invalid updatedAt');

        target.textContent = `Τελευταία ενημέρωση: ${formatted}`;
        target.setAttribute('title', data.commit ? `Commit: ${data.commit}` : '');
    } catch (error) {
        target.textContent = 'Τελευταία ενημέρωση: διαθέσιμη σύντομα.';
    }
}

function initializePage() {
    if (pageInitialized) return;
    pageInitialized = true;

    // Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => { preloader.style.display = 'none'; document.body.classList.remove('loading'); }, 700);
        }, 300);
    }

    // Cookies Check
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        setTimeout(() => { document.getElementById('cookieConsentBanner')?.classList.remove('hidden'); }, 1000);
    } else if (consent === 'accepted') {
        loadAllTracking();
    }

    // Hash Routing (nyxlabs.gr/#modalID)
    openModalFromHash();
    setTimeout(openModalFromHash, 0);

    // Delegated UI listeners
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);
    document.addEventListener('touchstart', handleSwipeBackTouchStart, { passive: true });
    document.addEventListener('touchend', handleSwipeBackTouchEnd, { passive: true });
    document.addEventListener('touchcancel', resetSwipeBackTracking, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            stopAllOfferViews({ beacon: true });
            stopAllOfferCardViews({ beacon: true });
        } else {
            resumeOpenOfferViews();
            refreshVisibleOfferCards();
        }
    });
    window.addEventListener('pagehide', () => {
        stopAllOfferViews({ beacon: true });
        stopAllOfferCardViews({ beacon: true });
    });

    window.addEventListener('hashchange', openModalFromHash);

    const imagePreviewViewport = document.getElementById('imagePreviewViewport');
    if (imagePreviewViewport) {
        imagePreviewViewport.addEventListener('wheel', handleImagePreviewWheel, { passive: false });
        imagePreviewViewport.addEventListener('touchstart', handleImagePreviewTouchStart, { passive: true });
        imagePreviewViewport.addEventListener('touchmove', handleImagePreviewTouchMove, { passive: false });
        imagePreviewViewport.addEventListener('touchend', handleImagePreviewTouchEnd);
        imagePreviewViewport.addEventListener('touchcancel', handleImagePreviewTouchEnd);
        imagePreviewViewport.addEventListener('pointerdown', handleImagePreviewPointerDown);
        imagePreviewViewport.addEventListener('pointermove', handleImagePreviewPointerMove);
        imagePreviewViewport.addEventListener('pointerup', handleImagePreviewPointerUp);
        imagePreviewViewport.addEventListener('pointercancel', stopImagePreviewDrag);
        imagePreviewViewport.addEventListener('mouseleave', stopImagePreviewDrag);
    }

    window.addEventListener('keydown', (event) => {
        const modal = document.getElementById('imagePreviewModal');
        if (!modal || modal.classList.contains('hidden')) return;

        if (event.key === 'Escape') closeModal('imagePreviewModal');
        if (event.key === '+' || event.key === '=') zoomImagePreview(0.25);
        if (event.key === '-') zoomImagePreview(-0.25);
        if (event.key === '0') resetImagePreviewZoom();
    });

    // Intersection Observer για τα Animations (Reveal)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${i * 100}ms`;
        observer.observe(el);
    });

    initializeOfferCardTracking();
    loadSiteUpdateNotice();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage, { once: true });
} else {
    initializePage();
}

// Διαχείριση "Πίσω" στο Browser / κινητό
window.onpopstate = function (event) {
    const state = event.state || {};

    const preview = document.getElementById('imagePreviewModal');
    if (preview) {
        preview.classList.add('hidden');
        stopImagePreviewDrag();
        resetImagePreviewZoom(false);
    }

    document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach((modal) => {
        if (modal.id) stopOfferView(modal.id);
        modal.classList.add('hidden');
    });

    if (state.screen === 'image-preview' && state.previewSrc) {
        if (state.parentModalId) {
            openModal(state.parentModalId, false);
        }

        openImagePreview(state.previewSrc, false);
        return;
    }

    if ((state.screen === 'offer' || state.modalId) && state.modalId) {
        openModal(state.modalId, false);
        return;
    }

    unlockPageScrollIfIdle();
    requestAnimationFrame(refreshVisibleOfferCards);
};
