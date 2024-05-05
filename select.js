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

/*
 * Helper functions
 */

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

moveClass(ii, i1, name) {
  const children = this.elTable.children;
  console.log(`moving children ${!!children} ii=${ii} i1=${i1} name=`+name);
  const i0 = this.i[ii], c0 = children[i0], c1 = children[i1];
  console.log(`i0=${i0} i1=${i1} c0=${!!c0} c1=${!!c1}`);
  if (!c0) {
    debugger;
  }
  children[this.i[ii]].classList.remove(name);
  children[this.i[ii]=i1].classList.add(name);
}

updateMenuState(open, callFocus = true) {
  if (this.open == open);
  else if (this.open = open) this.el.classList.add('open');
  else {
    this.el.classList.remove('open');
    if(!isElementInView(this.elCombo)) this.elCombo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    this.elCombo.focus(); // move focus back to the combobox, if needed
  }
};

selectOption() {
  // update state
  const i = this.i[1] = this.i[0];
  this.elCombo.innerText = this.options[i]; // update displayed value
  this.moveClass(1, i, 'aria-selected');
};

onOptionChange(index) {
  this.moveClass(0, index, 'option-current');
  if(this.open) {
    const option = this.elTable.children[index];
    // ensure the new option is in view
    if (isScrollable(this.elTable)) maintainScrollVisibility(option, this.elTable);
    // ensure the new option is visible on screen
    // ensure the new option is in view
    if (!isElementInView(option)) option.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else this.selectOption();
  
};

onOptionClick(index) {
  this.updateMenuState(false);
  this.onOptionChange(index);
};

onOptionMouseDown() {
  // Clicking an option will cause a blur event,
  // but we don't want to perform the default keyboard blur action
  this.ignoreBlur = true;
};

onComboBlur(event) {
  // do nothing if relatedTarget is contained within elTable
  if (this.elTable.contains(event.relatedTarget)) return;

  // select current option and close
  if (this.open) {
    this.selectOption();
    this.updateMenuState(false);
  }
};

onComboClick() {
  this.updateMenuState(!this.open);
};

onKeyDown(event) {
  const key = event.key== ' ' ? 'Enter' : event.key;
  const max = this.options.length - 1;

  const move =
    key == 'Home'       ? -max :
    key == 'Last'       ?  max :
    key == 'PageUp'     ?   -9 :
    key == 'PageDown'   ?    9 :
    key == 'ArrowUp'    ?   -1 :
    key == 'ArrowDown'  ?    1 :
  0;
  if (move) this.onOptionChange(Math.max(0,Math.min(this.i[0]+move,max)));
  else {
    let nopen = !this.open;
    if(key == 'Escape') nopen = false;
    else if(key != 'Enter') return;  // pass the event
    else if(!nopen) this.selectOption();
    this.updateMenuState(nopen);
  }

  event.preventDefault();
};

constructor (options = []) {

  // data
  this.options = options;

  // state
  this.open = false;
  this.i = [0,0]; // index of active candidate and selected element

  // element refs
  const el = this.el = document.createElement('div');
  el.className = "combo";
  (this.elCombo = appDiv(el, 'combo-input')).tabIndex = 0;
  (this.elTable = appType(el, 'table', 'combo-menu')).tabIndex = -1;

  // select first option by default
  this.elCombo.innerText = this.options[0];

  // add event listeners
  this.elTable.addEventListener('focusout', this.onComboBlur.bind(this));
  this.elCombo.addEventListener('blur', this.onComboBlur.bind(this));
  this.elCombo.addEventListener('click', this.onComboClick.bind(this));
  this.el     .addEventListener('keydown', this.onKeyDown.bind(this));

  // create options
  const onClick = event => {
    this.onOptionClick(event.target.parentElement.rowIndex);
    event.stopPropagation();
  };
  // Clicking an option will cause a blur event,
  // but we don't want to perform the default keyboard blur action
  const onDown = event => this.ignoreBlur = true;
  for (const option of options) {
    const row = appType(this.elTable, 'tr', 'combo-option');
    appType(row, 'td').innerText = option;
    row.addEventListener('click', onClick);
    row.addEventListener('mousedown', onDown);
  };
};

}

// init select
window.addEventListener('load', function () {
  document.body.prepend(
    (new Select(['Choose a Fruit'
      ,'Apple','Banana','Peach','Cherry','Pear'
      ,'Durian','Melon','Fig','Plum','Grape','Guava'
    ])).el
  )
});