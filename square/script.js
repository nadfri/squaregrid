'use strict';

form.onsubmit = (e) => e.preventDefault();

let N = 1;

const calculN = () => {
  error.style.display = 'none';
  inputN.value = '';
  inputCoef.value = '';
  inputPowCoef.value = '';

  N = (inputP.value || 1) * (inputQ.value || 1);

  spanN.textContent = N.toLocaleString();
  spanN2.textContent = N.toLocaleString();

  inputN.value = N;

  spanSafe.textContent = Number.isSafeInteger(N) ? 'YES' : 'NO';
  spanSafe.style.color = Number.isSafeInteger(N) ? 'yellowgreen' : 'red';
  btnFind.disabled = !Number.isSafeInteger(N);
};

const calculNCoef = () => {
  error.style.display = 'none';

  if (inputPowCoef.valueAsNumber < 2) inputPowCoef.valueAsNumber = 2;

  N =
    (inputN.valueAsNumber || 1) *
    (inputCoef.valueAsNumber || 1) ** (inputPowCoef.valueAsNumber || 2);

  spanSafe.textContent = Number.isSafeInteger(N) ? 'YES' : 'NO';
  spanSafe.style.color = Number.isSafeInteger(N) ? 'yellowgreen' : 'red';
  btnFind.disabled = !Number.isSafeInteger(N);

  console.log('N with coef', N);
};

inputCoef.oninput = calculNCoef;
inputPowCoef.oninput = calculNCoef;

inputP.oninput = calculN;
inputQ.oninput = calculN;

inputN.oninput = () => {
  error.style.display = 'none';

  inputP.value = '';
  inputQ.value = '';
  inputCoef.value = '';
  inputPowCoef.value = '';
  spanN.textContent = '';

  N = inputN.valueAsNumber || 1;

  spanSafe.textContent = Number.isSafeInteger(N) ? 'YES' : 'NO';
  spanSafe.style.color = Number.isSafeInteger(N) ? 'yellowgreen' : 'red';
  btnFind.disabled = !Number.isSafeInteger(N);

  spanN2.textContent = N.toLocaleString();
};

calculN();

const find = () => {
  const racineN = Math.ceil(Math.sqrt(N));
  console.log('racineN= ' + racineN);

  let count = 0;

  let Y = (racineN + count) ** 2;
  const isCarré = (Y) => Number.isInteger(Math.sqrt(Y - N));

  //-----------------------------------------------------
  while (!isCarré(Y)) {
    if (count > 100000000) {
      error.style.display = 'block';
      return;
    }
    count++;
    Y = (racineN + count) ** 2;
  }

  const racineY = Math.sqrt(Y);
  const racineX = Math.sqrt(Y - N);

  spanY.textContent = racineY.toLocaleString();
  spanY2.textContent = racineY.toLocaleString();
  spanX.textContent = racineX.toLocaleString();
  spanX2.textContent = racineX.toLocaleString();

  spanCalcul.textContent = (count + 1).toLocaleString();

  console.log('count:' + count);
  console.log('Y=' + Y);
  console.log('safeY: ' + Number.isSafeInteger(Y));
  console.log('racineY= ' + racineY);
  console.log('racineX= ' + racineX);

  const p = racineY - racineX;
  const q = racineY + racineX;

  console.log('p= ' + p);
  spanP.textContent = p.toLocaleString();
  console.log('q= ' + q);
  spanQ.textContent = q.toLocaleString();
};

btnFind.onclick = find;