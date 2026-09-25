export const formatHouseholdFraction = (val: number): string => {
  const whole = Math.floor(val);
  const remainder = val - whole;
  
  const fractions = [
    { value: 0, text: '' },
    { value: 1/4, text: '1/4' },
    { value: 1/3, text: '1/3' },
    { value: 1/2, text: '1/2' },
    { value: 2/3, text: '2/3' },
    { value: 3/4, text: '3/4' },
    { value: 1, text: '' }
  ];

  let closest = fractions[0];
  let minDiff = Infinity;
  for (const f of fractions) {
    const diff = Math.abs(remainder - f.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = f;
    }
  }

  let finalWhole = whole;
  if (closest.value === 1) {
    finalWhole += 1;
    closest = fractions[0];
  }

  if (finalWhole === 0 && closest.text === '') return '0';
  if (finalWhole === 0) return closest.text;
  if (closest.text === '') return String(finalWhole);
  return `${finalWhole} e ${closest.text}`;
};
