(() => {
  'use strict';
  if (!/\/edit(?:[/?#]|$)/.test(location.pathname + location.search + location.hash)) return;
  if (document.getElementById('slides-align-panel')) return;
  const host = document.createElement('div');
  host.id = 'slides-align-panel';
  Object.assign(host.style, {position:'fixed',right:'26px',top:'145px',zIndex:'2147483646'});
  const root = host.attachShadow({mode:'open'});
  const style = document.createElement('style');
  style.textContent = `:host{font-family:Arial,'Noto Sans JP',sans-serif;color:#202124;font-size:12px;line-height:1.4}.panel{width:202px;background:#fff;border:1px solid #dadce0;border-radius:10px;box-shadow:0 4px 16px #0002;overflow:hidden}.head{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#f1f3f4;cursor:grab;user-select:none;touch-action:none}.head:active{cursor:grabbing}.body{padding:9px}.label{font-size:10px;color:#5f6368;margin:2px 0 5px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:7px}.two{grid-template-columns:repeat(2,1fr)}button{font:inherit;color:inherit;border:1px solid #dadce0;border-radius:5px;background:white;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:5px 0;min-height:42px}button:hover{background:#e8f0fe;border-color:#9bbcf7}button:disabled{opacity:.5;cursor:wait}.mini{display:block;min-height:0;padding:0 5px;border:0;background:transparent;font-size:17px;line-height:1.2}.status{font-size:10px;color:#5f6368;min-height:28px;overflow-wrap:anywhere}.status.error{color:#b3261e}.collapsed .body{display:none}.collapsed{width:130px}svg{display:block;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}`;
  root.append(style);
  const panel=document.createElement('div');panel.className='panel';
  panel.innerHTML='<div class="head"><b>整列パネル <small style="font-weight:normal;color:#777">0.2.4</small></b><button type="button" class="mini" title="折りたたむ" aria-label="折りたたむ">−</button></div><div class="body"><div class="label">左右に配置</div><div class="grid" id="horizontal"></div><div class="label">上下に配置</div><div class="grid" id="vertical"></div><div class="label">均等に配置</div><div class="grid two" id="distribution"></div><div class="label">ページ中央に配置</div><div class="grid two" id="page"></div><div class="status" role="status">図形を複数選択してから操作</div></div>';
  root.append(panel);document.documentElement.append(host);
  const groups={h:['配置','左右に配置','水平方向に配置','Align horizontally','Horizontal align','Align'],v:['配置','上下に配置','垂直方向に配置','Align vertically','Vertical align','Align'],d:['整列','均等に配置','均等配置','等間隔に配置','間隔を均等にする','間隔を均等に配置','均等に並べる','Distribute'],p:['ページ中央に配置','ページの中央に配置','Center on page','Centre on page']};
  const commands=[
    ['horizontal','左','h',['左','左揃え','左に配置','Left'],'M4 3V21 M7 6H19V10H7Z M7 14H14V18H7Z'],
    ['horizontal','中央','h',['中央(横)','中央(水平)','左右中央','水平中央','水平方向の中央','左右の中央','中央','中央揃え','中央に配置','Center','Centre'],'M12 3V21 M5 6H19V10H5Z M8 14H16V18H8Z'],
    ['horizontal','右','h',['右','右揃え','右に配置','Right'],'M20 3V21 M5 6H17V10H5Z M10 14H17V18H10Z'],
    ['vertical','上','v',['上','上揃え','上に配置','Top'],'M3 4H21 M6 7V19H10V7Z M14 7V14H18V7Z'],
    ['vertical','中央','v',['中央(縦)','中央(垂直)','上下中央','垂直中央','垂直方向の中央','上下の中央','中央','中央揃え','中央に配置','Middle','Center','Centre'],'M3 12H21 M6 5V19H10V5Z M14 8V16H18V8Z'],
    ['vertical','下','v',['下','下揃え','下に配置','Bottom'],'M3 20H21 M6 5V17H10V5Z M14 10V17H18V10Z'],
    ['distribution','水平','d',['水平','水平方向','横方向','横','左右','左右に均等配置','水平方向に配置','水平方向に均等に配置','左右に配置','Horizontally','Horizontal'],'M3 4V20 M21 4V20 M6 8H10V16H6Z M14 8H18V16H14Z M10 12H14'],
    ['distribution','垂直','d',['垂直','垂直方向','縦方向','縦','上下','上下に均等配置','垂直方向に配置','垂直方向に均等に配置','上下に配置','Vertically','Vertical'],'M4 3H20 M4 21H20 M8 6H16V10H8Z M8 14H16V18H8Z M12 10V14'],
    ['page','水平','p',['水平','水平方向','横方向','横','左右','Horizontally','Horizontal'],'M3 4H21V20H3Z M12 5V19 M8 9H16V15H8Z'],
    ['page','垂直','p',['垂直','垂直方向','縦方向','縦','上下','Vertically','Vertical'],'M3 4H21V20H3Z M4 12H20 M8 9H16V15H8Z']
  ];
  const status=panel.querySelector('.status');
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  // Google Slides Japanese menu labels include access keys, e.g. 配置(a).
  const norm=s=>String(s||'').normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/\s+/g,' ').trim().replace(/\s*\([a-z0-9]\)\s*$/i,'').trim().toLowerCase();
  const visible=e=>{if(!e||!e.isConnected||!e.getClientRects().length)return false;for(let a=e;a&&a!==document.documentElement;a=a.parentElement){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden'||a.getAttribute('aria-hidden')==='true')return false;}return true;};
  const disabled=e=>e.getAttribute('aria-disabled')==='true'||e.classList.contains('goog-menuitem-disabled')||e.classList.contains('goog-submenu-disabled')||e.classList.contains('docs-menuitem-disabled');
  const labels=e=>[e.getAttribute('aria-label'),e.getAttribute('title'),e.querySelector('.goog-menuitem-label')?.textContent,e.querySelector('.goog-menuitem-content')?.textContent,e.textContent].map(norm).filter(Boolean);
  const matches=(e,names)=>labels(e).some(t=>names.some(n=>t===norm(n)));
  const itemSelector='.goog-menuitem,.goog-submenu,[role="menuitem"],[role="menuitemradio"],[role="menuitemcheckbox"]';
  const items=()=>Array.from(document.querySelectorAll(itemSelector)).filter(e=>visible(e)&&!e.closest('#docs-menubar,.docs-menubar,[role="menubar"]')).filter(e=>{const outer=e.parentElement?.closest(itemSelector);return !outer||menuOf(outer)!==menuOf(e);});
  const menuOf=e=>e.closest('.goog-menu,[role="menu"]');
  const menuLabels=els=>els.map(e=>labels(e)[0]||'?').join(' / ').slice(0,180);
  const centerLeaf=(cmd,els)=>{
    const candidates=els.filter(e=>matches(e,cmd[3]));
    if(cmd[1]!=='中央'||!['h','v'].includes(cmd[2]))return candidates.length===1?candidates[0]:null;
    // In the combined Arrange > Align submenu, two entries may both be named 中央.
    const axis=cmd[2]==='h'?[commands[0],commands[2]]:[commands[3],commands[5]];
    const start=els.findIndex(e=>matches(e,axis[0][3])),end=els.findIndex(e=>matches(e,axis[1][3]));
    if(start>=0&&end>start){const between=candidates.filter(e=>els.indexOf(e)>start&&els.indexOf(e)<end);if(between.length===1)return between[0];}
    const explicit=candidates.filter(e=>labels(e).some(t=>cmd[2]==='h'?/左右|水平|\(横\)|^center$|^centre$/.test(t):/上下|垂直|\(縦\)|^middle$/.test(t)));
    if(explicit.length===1)return explicit[0];
    return candidates.length===1&&!(els.some(e=>matches(e,commands[0][3]))&&els.some(e=>matches(e,commands[3][3])))?candidates[0]:null;
  };
  const find=(names,exclude=new Set())=>items().find(e=>!exclude.has(e)&&matches(e,names));
  const wait=async(fn,ms=2500,stable=2,check=()=>{})=>{const end=performance.now()+ms;let previous=null,count=0;do{check();const val=fn();count=val&&val===previous?count+1:val?1:0;previous=val;if(count>=stable)return val;await sleep(65);}while(performance.now()<end);return null;};
  const mouse=(el,type,relatedTarget=null)=>{const r=el.getBoundingClientRect();el.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,view:window,button:0,buttons:type==='mousedown'?1:0,clientX:r.left+r.width/2,clientY:r.top+r.height/2,relatedTarget}));};
  const click=el=>{mouse(el,'mousedown');if(!visible(el))return;mouse(el,'mouseup');if(visible(el))mouse(el,'click');};
  const arrange=()=>{for(const id of ['docs-arrange-menu','docs-order-menu']){const e=document.getElementById(id);if(visible(e)&&matches(e,['配置','Arrange']))return e;}return Array.from(document.querySelectorAll('.goog-menu-button,[role="menuitem"],[role="button"]')).filter(visible).find(e=>matches(e,['配置','Arrange'])&&e.closest('#docs-menubar,.docs-menubar,[role="menubar"]'));};
  const menuEntries=menu=>items().filter(e=>menuOf(e)===menu);
  const visibleMenus=()=>[...new Set(items().map(menuOf).filter(Boolean))];
  const isArrangeRoot=menu=>{
    const es=menuEntries(menu);
    return es.some(e=>matches(e,['順序','Order']))&&es.some(e=>matches(e,['回転','Rotate']))&&es.some(e=>matches(e,groups.p));
  };
  const parentFor=cmd=>{
    const roots=visibleMenus().filter(isArrangeRoot);
    if(roots.length!==1)return null;
    const candidates=menuEntries(roots[0]).filter(e=>matches(e,groups[cmd[2]]));
    return candidates.length===1?candidates[0]:null;
  };
  const validSubmenu=(cmd,es)=>{
    if(['h','v'].includes(cmd[2])){
      // Confirm the group is an alignment submenu, never an arbitrary menu with a matching label.
      const axis=cmd[2]==='h'?[commands[0],commands[2]]:[commands[3],commands[5]];
      return axis.every(c=>es.some(e=>matches(e,c[3])));
    }
    const pair=cmd[2]==='d'?commands.slice(6,8):commands.slice(8,10);
    return pair.every(c=>es.some(e=>matches(e,c[3])))&&es.length===2;
  };
  let busy=false;
  async function run(cmd){
    if(busy)return;busy=true;status.className='status';status.textContent='配置メニューを確認中…';
    const buttons=panel.querySelectorAll('.body button');buttons.forEach(b=>b.disabled=true);
    let interrupted=false;
    const interrupt=e=>{if(e.isTrusted&&!e.composedPath().includes(host))interrupted=true;};
    const check=()=>{if(interrupted)throw Error('別の操作を検出したため中止しました。');};
    document.addEventListener('pointerdown',interrupt,true);document.addEventListener('keydown',interrupt,true);
    try{
      const a=arrange();if(!a)throw Error('上部の「配置」メニューが見つかりません。');
      let parent=parentFor(cmd);
      if(!parent){
        if(visibleMenus().length)throw Error('開いているメニューを Esc で閉じてから再試行してください。');
        click(a);parent=await wait(()=>parentFor(cmd),2600,2,check);
      }
      check();
      if(!parent)throw Error('親メニュー未検出：'+menuLabels(items()));
      if(disabled(parent))throw Error(cmd[2]==='d'?'均等配置は図形を3つ以上選択してください。':cmd[2]==='p'?'図形を選択してください。':'図形を2つ以上選択してください。');
      const parentMenu=menuOf(parent);
      const otherMenus=()=>visibleMenus().filter(m=>m!==parentMenu&&!isArrangeRoot(m));
      // Track actual menu entries, not just a reused menu container or matching words.
      const before=new Map(otherMenus().map(m=>[m,menuEntries(m)]));
      const beforeLabels=new Map(otherMenus().map(m=>[m,menuLabels(menuEntries(m))]));
      const changed=m=>{const old=before.get(m),now=menuEntries(m);return !old||old.length!==now.length||now.some((e,i)=>e!==old[i])||beforeLabels.get(m)!==menuLabels(now);};
      const related=()=>{
        const ids=(parent.getAttribute('aria-controls')||parent.getAttribute('aria-owns')||'').split(/\s+/).filter(Boolean);
        const possible=otherMenus().filter(m=>validSubmenu(cmd,menuEntries(m)));
        const explicit=possible.filter(m=>ids.includes(m.id));
        const fresh=possible.filter(changed);
        const candidates=explicit.length?explicit:fresh.length?fresh:parent.getAttribute('aria-expanded')==='true'?possible:[];
        return candidates.length===1?candidates[0]:null;
      };
      const leafFor=()=>{const menu=related();return menu?centerLeaf(cmd,menuEntries(menu)):null;};
      status.textContent='子メニューを確認中…';
      mouse(parent,'mouseover');mouse(parent,'mousemove');mouse(parent,'mouseenter');
      let leaf=await wait(leafFor,2300,2,check);
      // Retry only opening the submenu, never sending the final command twice.
      if(!leaf&&!related()&&visible(parent)&&isArrangeRoot(parentMenu)){
        check();click(parent);leaf=await wait(leafFor,2300,2,check);
      }
      check();
      if(!leaf)throw Error('子メニュー「'+(labels(parent)[0]||'?')+'」：'+(menuLabels(otherMenus().flatMap(menuEntries))||'表示されません'));
      const confirmed=related();
      if(!visible(parent)||!visible(leaf)||!confirmed||menuOf(leaf)!==confirmed||centerLeaf(cmd,menuEntries(confirmed))!==leaf)throw Error('対象メニューが切り替わったため中止しました。');
      if(disabled(leaf))throw Error('選択した図形ではこの操作を実行できません。');
      click(leaf);await sleep(180);status.textContent='操作を送信：'+cmd[1]+'（結果を確認）';
    }catch(e){status.className='status error';status.textContent=e.message+' メニューは Esc で閉じられます。';}
    finally{document.removeEventListener('pointerdown',interrupt,true);document.removeEventListener('keydown',interrupt,true);buttons.forEach(b=>b.disabled=false);busy=false;}
  }
  for(const cmd of commands){const button=document.createElement('button');button.type='button';button.title=panel.querySelector('#'+cmd[0]).previousElementSibling.textContent+'：'+cmd[1];button.setAttribute('aria-label',button.title);button.innerHTML=`<svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true"><path d="${cmd[4]}"/></svg><span>${cmd[1]}</span>`;button.addEventListener('click',()=>run(cmd));panel.querySelector('#'+cmd[0]).append(button);}
  // Prevent the panel from stealing focus from the editor selection.
  for(const type of ['pointerdown','mousedown'])host.addEventListener(type,e=>{if(e.composedPath().some(x=>x instanceof HTMLButtonElement)){e.preventDefault();e.stopPropagation();}},true);
  for(const type of ['click','mouseup','pointerup','keydown','keyup'])host.addEventListener(type,e=>e.stopPropagation());
  const mini=panel.querySelector('.mini');mini.addEventListener('click',()=>{const collapsed=panel.classList.toggle('collapsed');mini.textContent=collapsed?'+':'−';mini.title=collapsed?'展開':'折りたたむ';mini.setAttribute('aria-label',mini.title);});
  const head=panel.querySelector('.head');let drag=null;
  head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=host.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};head.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation();});
  head.addEventListener('pointermove',e=>{if(!drag)return;host.style.right='auto';host.style.left=Math.max(0,Math.min(innerWidth-host.offsetWidth,e.clientX-drag.x))+'px';host.style.top=Math.max(0,Math.min(innerHeight-35,e.clientY-drag.y))+'px';});
  head.addEventListener('pointerup',()=>drag=null);head.addEventListener('pointercancel',()=>drag=null);
})();
