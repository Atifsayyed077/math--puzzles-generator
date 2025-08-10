// script.js - simple puzzle generator & UI (beginner friendly)

// ---------- Utilities ----------
function el(id){ return document.getElementById(id); }
function create(tag, cls){ const n = document.createElement(tag); if(cls) n.className = cls; return n; }

// ---------- SUDOKU: generator (backtracking) & UI ----------
/* Very simple: generate full board with backtracking, then remove numbers.
   Difficulty is number of blanks to make (higher = harder). */

function makeEmptyGrid() {
  return Array.from({length:9}, ()=>Array(9).fill(0));
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function possible(grid,row,col,val){
  for(let i=0;i<9;i++){
    if(grid[row][i]===val) return false;
    if(grid[i][col]===val) return false;
    const br = Math.floor(row/3)*3 + Math.floor(i/3);
    const bc = Math.floor(col/3)*3 + (i%3);
    if(grid[br][bc]===val) return false;
  }
  return true;
}

function fillGrid(grid){
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(grid[r][c]===0){
        const nums = shuffle([1,2,3,4,5,6,7,8,9].slice());
        for(const n of nums){
          if(possible(grid,r,c,n)){
            grid[r][c]=n;
            if(fillGrid(grid)) return true;
            grid[r][c]=0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function copyGrid(g){ return g.map(r=>r.slice()); }

function removeNumbers(grid, blanks){
  const coords = [];
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) coords.push([r,c]);
  shuffle(coords);
  for(let i=0;i<blanks && i<coords.length;i++){
    const [r,c]=coords[i];
    grid[r][c]=0;
  }
}

// render sudoku UI
function renderSudoku(grid, original){
  const board = el('sudoku-board');
  board.innerHTML='';
  board.style.gridTemplateColumns = 'repeat(9,36px)';
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const input = create('input');
      input.maxLength = 1;
      input.type='text';
      input.inputMode='numeric';
      input.value = grid[r][c] || '';
      if(original && original[r][c]!==0){
        input.classList.add('prefill');
        input.disabled = true;
      } else {
        input.addEventListener('input', ()=> {
          const v = input.value.replace(/[^1-9]/g,'').slice(0,1);
          input.value = v;
        });
      }
      input.dataset.r = r; input.dataset.c = c;
      board.appendChild(input);
    }
  }
}

function getSudokuFromUI(){
  const board = el('sudoku-board');
  const inputs = board.querySelectorAll('input');
  const g = makeEmptyGrid();
  inputs.forEach(inp=>{
    const r=+inp.dataset.r, c=+inp.dataset.c;
    g[r][c] = inp.value ? parseInt(inp.value,10) : 0;
  });
  return g;
}

function checkSudokuSolution(){
  const g = getSudokuFromUI();
  // check rows, cols, boxes
  for(let r=0;r<9;r++){
    const seen = new Set();
    for(let c=0;c<9;c++){
      const v=g[r][c];
      if(!v || v<1 || v>9) return false;
      if(seen.has(v)) return false;
      seen.add(v);
    }
  }
  for(let c=0;c<9;c++){
    const seen=new Set();
    for(let r=0;r<9;r++){
      const v=g[r][c];
      if(seen.has(v)) return false;
      seen.add(v);
    }
  }
  for(let br=0;br<9;br+=3){
    for(let bc=0;bc<9;bc+=3){
      const seen=new Set();
      for(let r=0;r<3;r++) for(let c=0;c<3;c++){
        const v=g[br+r][bc+c];
        if(seen.has(v)) return false;
        seen.add(v);
      }
    }
  }
  return true;
}

// Solve using backtracking (mutates grid)
function solveSudoku(grid){
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(grid[r][c]===0){
        for(let v=1;v<=9;v++){
          if(possible(grid,r,c,v)){
            grid[r][c]=v;
            if(solveSudoku(grid)) return true;
            grid[r][c]=0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// ---------- KAKURO (simple sample loader & UI) ----------
/* Full kakuro generator is complex. We'll provide a sample grid loader and checking.
   A kakuro cell can be:
   - block: a black cell (possibly with clues)
   - entry: a white cell where the user types a digit 1-9

   For sample, we prepare a small 6x6 layout.
*/

const sampleKakuro = {
  rows: 6, cols: 6,
  // each cell: {type:'block'} or {type:'clue', across:sum or null, down:sum or null} or {type:'entry', value:0}
  grid: [
    [{type:'block'},{type:'clue',across:4,down:null},{type:'clue',across:22,down:null},{type:'block'},{type:'clue',across:16,down:null},{type:'clue',across:6,down:null}],
    [{type:'clue',across:null,down:3},{type:'entry'},{type:'entry'},{type:'clue',across:null,down:17},{type:'entry'},{type:'entry'}],
    [{type:'clue',across:null,down:30},{type:'entry'},{type:'entry'},{type:'entry'},{type:'entry'},{type:'entry'}],
    [{type:'block'},{type:'clue',across:27,down:null},{type:'entry'},{type:'entry'},{type:'clue',across:12,down:null},{type:'entry'}],
    [{type:'clue',across:null,down:12},{type:'entry'},{type:'entry'},{type:'clue',across:null,down:7},{type:'entry'},{type:'entry'}],
    [{type:'clue',across:null,down:7},{type:'entry'},{type:'entry'},{type:'clue',across:null,down:4},{type:'entry'},{type:'entry'}]
  ]
};

function renderKakuro(data){
  const board = el('kakuro-board');
  board.innerHTML='';
  const r = data.rows, c=data.cols;
  board.style.gridTemplateColumns = `repeat(${c},44px)`;
  board.style.width = `${c*46}px`;
  for(let i=0;i<r;i++){
    for(let j=0;j<c;j++){
      const cell = data.grid[i][j];
      const div = create('div','kakuro-cell');
      if(cell.type==='block') { div.classList.add('block'); }
      else if(cell.type==='clue'){
        div.classList.add('block');
        const clue = create('div','kakuro-clue');
        clue.innerHTML = `${cell.down?cell.down:''}${cell.down && cell.across?'<br>':''}${cell.across?cell.across:''}`;
        div.appendChild(clue);
      } else if(cell.type==='entry'){
        const inp = create('input');
        inp.maxLength=1; inp.type='text'; inp.inputMode='numeric';
        inp.dataset.r=i; inp.dataset.c=j;
        inp.addEventListener('input', ()=> { inp.value = inp.value.replace(/[^1-9]/g,'').slice(0,1); });
        div.appendChild(inp);
      }
      board.appendChild(div);
    }
  }
}

function checkKakuro(data){
  // For each clue cell with across sum, collect entries to the right until block, sum and check unique 1-9
  const r=data.rows, c=data.cols;
  for(let i=0;i<r;i++){
    for(let j=0;j<c;j++){
      const cell=data.grid[i][j];
      if(cell.type==='clue'){
        if(cell.across){
          // collect
          let sum=0; const seen=new Set();
          let x=j+1;
          while(x<c && data.grid[i][x].type==='entry'){
            const inp = el('kakuro-board').children[i*c + x].querySelector('input');
            const v = inp && inp.value ? parseInt(inp.value,10) : 0;
            if(v<1||v>9) return false;
            if(seen.has(v)) return false;
            seen.add(v);
            sum+=v; x++;
          }
          if(sum !== cell.across) return false;
        }
        if(cell.down){
          let sum=0; const seen=new Set();
          let y=i+1;
          while(y<r && data.grid[y][j].type==='entry'){
            const inp = el('kakuro-board').children[y*c + j].querySelector('input');
            const v = inp && inp.value ? parseInt(inp.value,10) : 0;
            if(v<1||v>9) return false;
            if(seen.has(v)) return false;
            seen.add(v);
            sum+=v; y++;
          }
          if(sum !== cell.down) return false;
        }
      }
    }
  }
  return true;
}

// ---------- LIGHTS OUT (logic puzzle) ----------
function makeLights(size){
  const arr = Array.from({length:size}, ()=>Array(size).fill(false));
  return arr;
}
function randomizeLights(arr){
  const n=arr.length;
  // perform random toggles to make puzzle solvable
  for(let i=0;i<n*n;i++){
    if(Math.random()<0.3){
      const r=Math.floor(Math.random()*n), c=Math.floor(Math.random()*n);
      toggleLight(arr,r,c);
    }
  }
}
function toggleLight(arr,r,c){
  const n=arr.length;
  const toggle=(i,j)=>{ if(i>=0 && j>=0 && i<n && j<n) arr[i][j]=!arr[i][j]; };
  toggle(r,c); toggle(r-1,c); toggle(r+1,c); toggle(r,c-1); toggle(r,c+1);
}

function renderLights(arr){
  const board = el('lights-board');
  board.innerHTML='';
  const n=arr.length;
  board.style.gridTemplateColumns = `repeat(${n},44px)`;
  board.style.width = `${n*50}px`;
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      const d = create('div','lights-cell ' + (arr[i][j] ? 'lights-on' : 'lights-off'));
      d.textContent = arr[i][j] ? '●' : '';
      d.addEventListener('click', ()=>{
        toggleLight(arr,i,j);
        renderLights(arr);
      });
      board.appendChild(d);
    }
  }
}

// ---------- Save / Load ----------
function saveAll() {
  const data = {
    sudoku: { boardUI: getSudokuFromUI(), timestamp: Date.now() },
    kakuro: { sample: sampleKakuro, timestamp: Date.now() },
    lights: window._lightsState || { size:5, grid: makeLights(5) }
  };
  localStorage.setItem('mathpuzzles.save', JSON.stringify(data));
  alert('Saved to localStorage.');
}

function loadAll() {
  const raw = localStorage.getItem('mathpuzzles.save');
  if(!raw){ alert('No saved data'); return; }
  const data = JSON.parse(raw);
  // load sudoku (if exists)
  if(data.sudoku && data.sudoku.boardUI) {
    renderSudoku(data.sudoku.boardUI, []); // original empty: allow editing
  }
  // kakuro
  if(data.kakuro && data.kakuro.sample) renderKakuro(data.kakuro.sample);
  // lights
  if(data.lights) {
    const g = data.lights.grid || makeLights(5);
    window._lightsState = { size: g.length, grid: g };
    renderLights(window._lightsState.grid);
  }
  alert('Loaded from localStorage.');
}

function downloadAll(){
  const raw = localStorage.getItem('mathpuzzles.save') || JSON.stringify({ timestamp:Date.now() });
  const blob = new Blob([raw], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mathpuzzles.json'; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

function uploadFile(file){
  const reader = new FileReader();
  reader.onload = ()=> {
    try {
      const data = JSON.parse(reader.result);
      localStorage.setItem('mathpuzzles.save', JSON.stringify(data));
      alert('Imported and saved to localStorage.');
    } catch(e){
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

// ---------- Hook up buttons ----------
document.addEventListener('DOMContentLoaded', ()=>{
  // Sudoku
  el('generate-sudoku').addEventListener('click', ()=>{
    const blanks = parseInt(el('sudoku-diff').value,10) || 50;
    const grid = makeEmptyGrid();
    fillGrid(grid);
    const original = copyGrid(grid);
    removeNumbers(grid, blanks);
    renderSudoku(grid, original);
    el('sudoku-board').dataset.original = JSON.stringify(original);
  });
  el('check-sudoku').addEventListener('click', ()=>{
    const ok = checkSudokuSolution();
    alert(ok ? 'Sudoku looks valid! 🎉' : 'Incorrect or incomplete. Keep trying.');
  });
  el('solve-sudoku').addEventListener('click', ()=>{
    const ui = getSudokuFromUI();
    const copy = copyGrid(ui);
    if(solveSudoku(copy)){
      renderSudoku(copy, JSON.parse(el('sudoku-board').dataset.original || '[]'));
    } else alert('No solution found.');
  });
  el('save-sudoku').addEventListener('click', saveAll);
  el('load-sudoku').addEventListener('click', loadAll);

  // Kakuro
  el('load-sample-kakuro').addEventListener('click', ()=> renderKakuro(sampleKakuro));
  el('check-kakuro').addEventListener('click', ()=>{
    const ok = checkKakuro(sampleKakuro);
    alert(ok ? 'Kakuro correct!' : 'Kakuro has errors or is incomplete.');
  });
  el('save-kakuro').addEventListener('click', saveAll);
  el('load-kakuro').addEventListener('click', loadAll);

  // Lights
  function newLights(){
    const size = parseInt(el('lights-size').value,10);
    const g = makeLights(size);
    randomizeLights(g);
    window._lightsState = { size, grid: g };
    renderLights(g);
  }
  el('new-lights').addEventListener('click', newLights);
  el('solve-lights').addEventListener('click', ()=>{
    // reset to all off
    const s = window._lightsState?.size || 5;
    window._lightsState = { size:s, grid: makeLights(s) };
    renderLights(window._lightsState.grid);
  });
  el('save-lights').addEventListener('click', saveAll);
  el('load-lights').addEventListener('click', loadAll);

  // Files
  el('export-json').addEventListener('click', downloadAll);
  el('import-file').addEventListener('change', (e)=> {
    if(e.target.files && e.target.files[0]) uploadFile(e.target.files[0]);
  });

  // initial state
  el('generate-sudoku').click();
  el('load-sample-kakuro').click();
  el('new-lights').click();
});
