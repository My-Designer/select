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

function scrollInto(e) {e.scrollIntoView({behavior: 'smooth', block: 'nearest'});}

function logevent(e) {console.log('Event: '+e)}

class Select {

moveClass(i1, name) {
  const children = this.elTable.children;
  const i0 = this[name], c0 = children[i0], c1 = children[i1];
  console.log(`moving class ${name} ${i0} => ${i1}`);
  children[this[name]].classList.remove(name);
  children[this[name]=i1].classList.add(name);
}

setMarked(index) {
  if (!this.open) return;
  this.moveClass(index, 'marked');
  scrollInto(this.elTable.children[index]);
}

setChosen(index) {
  this.moveClass(index, 'chosen');
  this.elCombo.innerText = this.options[index];
  this.setMarked(index);
}

chooseMarked() {
  this.setChosen(this.marked);
};

updateMenuState(open=false, choose) {
  if (this.open == open);
  else if (this.open = open) {
    this.el.classList.add('open');
    this.setMarked(this.chosen);
    this.elTable.focus();
  } else {
    this.el.classList.remove('open');
    if (choose) this.chooseMarked();
    scrollInto(this.elCombo);
    this.elCombo.focus();
  }
};

onTableBlur(event) {
  const related = this.elCombo == event.relatedTarget;
  logevent('blur table, related='+related);
  if (!related||!this.mousedown) this.updateMenuState(false);
};

onComboClick() {
  logevent('comboclick');
  this.mousedown = false;
  this.updateMenuState(!this.open);
};

onMouseDown() {
  logevent('mousedown');
  this.mousedown = true;
}

onTableClick(event) {
  logevent('tableclick');
  this.mousedown = false;
  this.updateMenuState(false, true)
  event.stopPropagation();
};

onKeyDown(event) {
  logevent('keydown');
  if(event.isComposing || event.keyCode == 229) return;
  if(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const key = event.key, max = this.options.length - 1;

  const move = {
    Home:   -max,
    End:     max,
    PageUp:   -9,
    PageDown:  9,
    ArrowUp:  -1,
    ArrowDown: 1,
  }[key];
  if (move) {
    const index = this.open ? this.marked : this.chosen;
    this.setChosen(Math.max(0,Math.min(index+move,max)));
  } else if(key == 'Escape') this.updateMenuState(false);
  else if(key == 'Enter') this.updateMenuState(!this.open, true);
  else return; // pass the event

  event.preventDefault();
};

onMouseEnter(event) {
  const index = event.target.rowIndex;
  logevent('mouse enter '+index);
  this.setMarked(index);
};

constructor (options = []) {
  this.options = options;

  this.chosen = this.marked = 0;

  const el = this.el = document.createElement('div');
  el.className = "combo";
  (this.elCombo = appDiv(el, 'combo-input')).tabIndex = 0;
  (this.elTable = appType(el, 'table', 'combo-menu')).tabIndex = -1;

  const listen = (element, event, fun) => element.addEventListener(event, fun.bind(this));

  listen(this.elTable, 'blur', this.onTableBlur);
  listen(this.elCombo, 'mousedown', this.onMouseDown);
  listen(this.elCombo, 'click', this.onComboClick);
  listen(this.elTable, 'click', this.onTableClick);
  listen(this.elCombo, 'keydown', this.onKeyDown);
  listen(this.elTable, 'keydown', this.onKeyDown);

  for (const option of options) {
    const row = appType(this.elTable, 'tr', 'combo-option');
    appType(row, 'td').innerText = option;
    listen(row, 'mouseenter', this.onMouseEnter);
  };

  this.chooseMarked();
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