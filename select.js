function appType(element, typeName, className) {
  const d = document.createElement(typeName);
  if (className) d.className = className;
  element.append(d);
  return d;
}

function appDiv(element, className) {
  return appType(element, 'div', className);
}

function dobby(id) {return document.getElementById(id);}

// Save a list of named combobox actions, for future readability
const SelectActions = {
  Close: 0,
  CloseSelect: 1,
  First: 2,
  Last: 3,
  Next: 4,
  Open: 5,
  PageDown: 6,
  PageUp: 7,
  Previous: 8,
  Select: 9,
};

/*
 * Helper functions
 */

// filter an array of options against an input string
// returns an array of options that begin with the filter string, case-independent
function filterOptions(options = [], filter, exclude = []) {
  return options.filter((option) => {
    const matches = option.toLowerCase().indexOf(filter.toLowerCase()) === 0;
    return matches && exclude.indexOf(option) < 0;
  });
}

// map a key press to an action
function getActionFromKey(event, menuOpen) {
  const { key, altKey, ctrlKey, metaKey } = event;
  const openKeys = ['ArrowDown', 'ArrowUp', 'Enter', ' ']; // all keys that will do the default open action
  // handle opening when closed
  if (!menuOpen && openKeys.includes(key)) {
    return SelectActions.Open;
  }

  // home and end move the selected option when open or closed
  if (key === 'Home') {
    return SelectActions.First;
  }
  if (key === 'End') {
    return SelectActions.Last;
  }

  // handle keys when open
  if (menuOpen) {
    if (key === 'ArrowUp' && altKey) {
      return SelectActions.CloseSelect;
    } else if (key === 'ArrowDown' && !altKey) {
      return SelectActions.Next;
    } else if (key === 'ArrowUp') {
      return SelectActions.Previous;
    } else if (key === 'PageUp') {
      return SelectActions.PageUp;
    } else if (key === 'PageDown') {
      return SelectActions.PageDown;
    } else if (key === 'Escape') {
      return SelectActions.Close;
    } else if (key === 'Enter' || key === ' ') {
      return SelectActions.CloseSelect;
    }
  }
}

// get an updated option index after performing an action
function getUpdatedIndex(currentIndex, maxIndex, action) {
  const pageSize = 10; // used for pageup/pagedown

  switch (action) {
    case SelectActions.First:
      return 0;
    case SelectActions.Last:
      return maxIndex;
    case SelectActions.Previous:
      return Math.max(0, currentIndex - 1);
    case SelectActions.Next:
      return Math.min(maxIndex, currentIndex + 1);
    case SelectActions.PageUp:
      return Math.max(0, currentIndex - pageSize);
    case SelectActions.PageDown:
      return Math.min(maxIndex, currentIndex + pageSize);
    default:
      return currentIndex;
  }
}

// check if element is visible in browser view port
function isElementInView(element) {
  var bounding = element.getBoundingClientRect();

  return (
    bounding.top >= 0 &&
    bounding.left >= 0 &&
    bounding.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    bounding.right <=
      (window.innerWidth || document.documentElement.clientWidth)
  );
}

// check if an element is currently scrollable
function isScrollable(element) {
  return element && element.clientHeight < element.scrollHeight;
}

// ensure a given child element is within the parent's visible scroll area
// if the child is not visible, scroll the parent
function maintainScrollVisibility(activeElement, scrollParent) {
  const { offsetHeight, offsetTop } = activeElement;
  const { offsetHeight: parentOffsetHeight, scrollTop } = scrollParent;

  const isAbove = offsetTop < scrollTop;
  const isBelow = offsetTop + offsetHeight > scrollTop + parentOffsetHeight;

  if (isAbove) {
    scrollParent.scrollTo(0, offsetTop);
  } else if (isBelow) {
    scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight);
  }
}

/*
 * Select Component
 * Accepts a combobox element and an array of string options
 */
class Select {

constructor (el, options = []) {
  // element refs
  this.el = el;
  this.comboEl = dobby('combo1');
  this.listboxEl = dobby('listbox1');

  // data
  this.idBase = this.comboEl.id || 'combo';
  this.options = options;

  // state
  this.activeIndex = 0;
  this.open = false;

  // init
  if (el && this.comboEl && this.listboxEl) {
    this.init();
  }
};

init() {
  // select first option by default
  this.comboEl.innerHTML = this.options[0];

  // add event listeners
  this.comboEl.addEventListener('blur', this.onComboBlur.bind(this));
  this.listboxEl.addEventListener('focusout', this.onComboBlur.bind(this));
  this.comboEl.addEventListener('click', this.onComboClick.bind(this));
  this.comboEl.addEventListener('keydown', this.onComboKeyDown.bind(this));

  // create options
  this.options.map((option, index) => {
    const optionEl = this.createOption(option, index);
    this.listboxEl.appendChild(optionEl);
  });
};

createOption(optionText, index) {
  const optionEl = document.createElement('div');
  optionEl.setAttribute('role', 'option');
  optionEl.id = `${this.idBase}-${index}`;
  optionEl.className =
    index === 0 ? 'combo-option option-current' : 'combo-option';
  optionEl.setAttribute('aria-selected', `${index === 0}`);
  optionEl.innerText = optionText;

  optionEl.addEventListener('click', (event) => {
    event.stopPropagation();
    this.onOptionClick(index);
  });
  optionEl.addEventListener('mousedown', this.onOptionMouseDown.bind(this));

  return optionEl;
};

onComboBlur(event) {
  // do nothing if relatedTarget is contained within listboxEl
  if (this.listboxEl.contains(event.relatedTarget)) {
    return;
  }

  // select current option and close
  if (this.open) {
    this.selectOption(this.activeIndex);
    this.updateMenuState(false, false);
  }
};

onComboClick() {
  this.updateMenuState(!this.open, false);
};

onComboKeyDown(event) {
  const { key } = event;
  const max = this.options.length - 1;

  const action = getActionFromKey(event, this.open);

  switch (action) {
    case SelectActions.Last:
    case SelectActions.First:
      this.updateMenuState(true);
    // intentional fallthrough
    case SelectActions.Next:
    case SelectActions.Previous:
    case SelectActions.PageUp:
    case SelectActions.PageDown:
      event.preventDefault();
      return this.onOptionChange(
        getUpdatedIndex(this.activeIndex, max, action)
      );
    case SelectActions.CloseSelect:
      event.preventDefault();
      this.selectOption(this.activeIndex);
    // intentional fallthrough
    case SelectActions.Close:
      event.preventDefault();
      return this.updateMenuState(false);
    case SelectActions.Open:
      event.preventDefault();
      return this.updateMenuState(true);
  }
};

onOptionChange(index) {
  // update state
  this.activeIndex = index;

  // update active option styles
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.classList.remove('option-current');
  });
  options[index].classList.add('option-current');

  // ensure the new option is in view
  if (isScrollable(this.listboxEl)) {
    maintainScrollVisibility(options[index], this.listboxEl);
  }

  // ensure the new option is visible on screen
  // ensure the new option is in view
  if (!isElementInView(options[index])) {
    options[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

onOptionClick(index) {
  this.onOptionChange(index);
  this.selectOption(index);
  this.updateMenuState(false);
};

onOptionMouseDown() {
  // Clicking an option will cause a blur event,
  // but we don't want to perform the default keyboard blur action
  this.ignoreBlur = true;
};

selectOption(index) {
  // update state
  this.activeIndex = index;

  // update displayed value
  const selected = this.options[index];
  this.comboEl.innerHTML = selected;

  // update aria-selected
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.setAttribute('aria-selected', 'false');
  });
  options[index].setAttribute('aria-selected', 'true');
};

updateMenuState(open, callFocus = true) {
  if (this.open === open) {
    return;
  }

  // update state
  this.open = open;

  open ? this.el.classList.add('open') : this.el.classList.remove('open');

  const activeID = open ? `${this.idBase}-${this.activeIndex}` : '';
  
  if (activeID === '' && !isElementInView(this.comboEl)) {
    this.comboEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // move focus back to the combobox, if needed
  callFocus && this.comboEl.focus();
};

}

// init select
window.addEventListener('load', function () {
  new Select(dobby("js-select"), ['Choose a Fruit'
  ,'Apple','Banana','Peach','Cherry','Pear'
  ,'Durian','Melon','Fig','Plum','Grape','Guava'
  ]);
});