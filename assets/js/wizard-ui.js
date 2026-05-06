/* =========================================
   Wizard UI controller
   Non-breaking enhancement for activation process modals.
   Works with simple data attributes and keeps existing modal logic intact.
========================================= */
(function () {
  const WIZARD_SELECTOR = '[data-wizard]';

  function getSteps(wizard) {
    return Array.from(wizard.querySelectorAll('[data-wizard-step]'));
  }

  function getIndicators(wizard) {
    return Array.from(wizard.querySelectorAll('[data-wizard-indicator]'));
  }

  function getCurrentIndex(wizard) {
    const value = Number(wizard.dataset.wizardCurrent || 0);
    return Number.isNaN(value) ? 0 : value;
  }

  function setCurrentIndex(wizard, index) {
    wizard.dataset.wizardCurrent = String(index);
  }

  function updateSummary(wizard, currentIndex, total) {
    const currentLabel = wizard.querySelector('[data-wizard-current-label]');
    const progressLabel = wizard.querySelector('[data-wizard-progress-label]');
    const progressBar = wizard.querySelector('[data-wizard-progress-bar]');
    const activeStep = wizard.querySelector(`[data-wizard-step="${currentIndex}"]`);
    const title = activeStep?.dataset.stepTitle || `Βήμα ${currentIndex + 1}`;
    const percent = total > 1 ? ((currentIndex + 1) / total) * 100 : 100;

    if (currentLabel) currentLabel.textContent = title;
    if (progressLabel) progressLabel.textContent = `Βήμα ${currentIndex + 1} από ${total}`;
    if (progressBar) progressBar.style.width = `${percent}%`;
  }

  function updateButtons(wizard, currentIndex, total) {
    const prevButton = wizard.querySelector('[data-wizard-prev]');
    const nextButton = wizard.querySelector('[data-wizard-next]');

    if (prevButton) {
      prevButton.disabled = currentIndex === 0;
      prevButton.classList.toggle('opacity-50', currentIndex === 0);
      prevButton.classList.toggle('cursor-not-allowed', currentIndex === 0);
    }

    if (nextButton) {
      nextButton.textContent = currentIndex === total - 1 ? 'Ολοκλήρωση' : 'Επόμενο';
      nextButton.dataset.complete = currentIndex === total - 1 ? 'true' : 'false';
    }
  }

  function updateIndicators(wizard, currentIndex) {
    getIndicators(wizard).forEach((indicator, index) => {
      const isActive = index === currentIndex;
      const isCompleted = index < currentIndex;
      const circle = indicator.querySelector('[data-wizard-indicator-circle]');
      const label = indicator.querySelector('[data-wizard-indicator-label]');

      indicator.classList.toggle('opacity-60', !isActive && !isCompleted);
      indicator.classList.toggle('opacity-100', isActive || isCompleted);

      if (circle) {
        circle.classList.remove('bg-slate-200', 'text-slate-500', 'bg-slate-900', 'text-white', 'bg-emerald-500');
        if (isCompleted) {
          circle.classList.add('bg-emerald-500', 'text-white');
          circle.textContent = '✓';
        } else if (isActive) {
          circle.classList.add('bg-slate-900', 'text-white');
          circle.textContent = String(index + 1);
        } else {
          circle.classList.add('bg-slate-200', 'text-slate-500');
          circle.textContent = String(index + 1);
        }
      }

      if (label) {
        label.classList.toggle('text-slate-900', isActive || isCompleted);
        label.classList.toggle('text-slate-400', !isActive && !isCompleted);
      }
    });
  }

  function renderWizard(wizard) {
    const steps = getSteps(wizard);
    if (!steps.length) return;

    let currentIndex = getCurrentIndex(wizard);
    currentIndex = Math.max(0, Math.min(currentIndex, steps.length - 1));
    setCurrentIndex(wizard, currentIndex);

    steps.forEach((step, index) => {
      const isActive = index === currentIndex;
      step.classList.toggle('hidden', !isActive);
      step.setAttribute('aria-hidden', String(!isActive));
    });

    updateIndicators(wizard, currentIndex);
    updateButtons(wizard, currentIndex, steps.length);
    updateSummary(wizard, currentIndex, steps.length);
  }

  function goToStep(wizard, nextIndex) {
    setCurrentIndex(wizard, nextIndex);
    renderWizard(wizard);
  }

  function initializeWizard(wizard) {
    if (wizard.dataset.wizardReady === 'true') return;
    wizard.dataset.wizardReady = 'true';
    if (!wizard.dataset.wizardCurrent) wizard.dataset.wizardCurrent = '0';
    renderWizard(wizard);
  }

  document.addEventListener('click', function (event) {
    const indicatorButton = event.target.closest('[data-wizard-go]');
    if (indicatorButton) {
      const wizard = indicatorButton.closest(WIZARD_SELECTOR);
      if (!wizard) return;
      const stepIndex = Number(indicatorButton.dataset.wizardGo || 0);
      goToStep(wizard, stepIndex);
      return;
    }

    const prevButton = event.target.closest('[data-wizard-prev]');
    if (prevButton) {
      const wizard = prevButton.closest(WIZARD_SELECTOR);
      if (!wizard) return;
      const currentIndex = getCurrentIndex(wizard);
      if (currentIndex > 0) goToStep(wizard, currentIndex - 1);
      return;
    }

    const nextButton = event.target.closest('[data-wizard-next]');
    if (nextButton) {
      const wizard = nextButton.closest(WIZARD_SELECTOR);
      if (!wizard) return;
      const steps = getSteps(wizard);
      const currentIndex = getCurrentIndex(wizard);

      if (currentIndex < steps.length - 1) {
        goToStep(wizard, currentIndex + 1);
      } else {
        const success = wizard.querySelector('[data-wizard-complete-state]');
        if (success) {
          success.classList.remove('hidden');
          success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll(WIZARD_SELECTOR).forEach(initializeWizard);
  });

  window.initializeActivationWizards = function () {
    document.querySelectorAll(WIZARD_SELECTOR).forEach(initializeWizard);
  };
})();
