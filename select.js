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


function scrollInto(e) {
  e.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

updateMenuState(open) {
  if (this.open == open);
  else if (this.open = open) {
    this.el.classList.add('open');
    const index = this.i[0];
    console.log('updateMenuState '+index);
    scrollInto(this.elTable.children[index]);
  } else {
    const index = this.i[1];
    this.moveClass(0, index, 'option-current');
    this.el.classList.remove('open');
    scrollInto(this.elCombo);
    this.elCombo.focus(); // move focus back to the combobox, if needed
  }
};

selectOption() {
  const i = this.i[0];
  this.elCombo.innerText = this.options[i]; // update displayed value
  this.moveClass(1, i, 'aria-selected');
};

onOptionChange(index) {
  this.moveClass(0, index, 'option-current');
  if(this.open) scrollInto(this.elTable.children[index]);
  else this.selectOption();
  
};

onOptionClick(index) {
  console.log('onOptionClick>() '+index);
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
  if(event.isComposing || event.keyCode == 229) return;
  if(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const key = event.key== ' ' ? 'Enter' : event.key;
  const max = this.options.length - 1;

  const move =
    key == 'Home'       ? -max :
    key == 'End'        ?  max :
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