(function(){
  var root=document.documentElement;
  var stored;
  try{stored=localStorage.getItem('rbx-theme')}catch(e){}
  var systemDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme=stored==='dark'||stored==='light'?stored:(systemDark?'dark':'light');
  var nav=document.querySelector('.nav');
  if(!nav)return;
  var button=document.createElement('button');
  button.className='theme-toggle';button.type='button';button.setAttribute('aria-label','Toggle light and dark mode');
  var icon=document.createElement('span');icon.className='theme-icon';
  var label=document.createElement('span');label.className='theme-label';
  button.append(icon,label);nav.insertBefore(button,nav.firstChild);
  function update(){var dark=root.dataset.theme==='dark';icon.textContent=dark?'☼':'☾';label.textContent=dark?'Light mode':'Dark mode';button.setAttribute('aria-pressed',String(dark));}
  button.addEventListener('click',function(){root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('rbx-theme',root.dataset.theme)}catch(e){}update()});
  update();
})();
