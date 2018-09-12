// https://ru.wikihow.com/%D0%BD%D0%B0%D0%B9%D1%82%D0%B8-%D0%BF%D0%BB%D0%BE%D1%89%D0%B0%D0%B4%D1%8C-%D0%BC%D0%BD%D0%BE%D0%B3%D0%BE%D1%83%D0%B3%D0%BE%D0%BB%D1%8C%D0%BD%D0%B8%D0%BA%D0%B0

const polygon = [
  [0, 0],
  [0, 2],
  [2, 2],
  [2, 0],
  [0, 0],
];

let i = 0;
const multiply = polygon.reduce((memo, xy) => {
  i += 1;
  if (polygon[i]) {
    return [
      ...memo,
      [
        xy[0] * polygon[i][1],
        xy[1] * polygon[i][0],
      ],
    ];
  }
  return memo;
}, []);

const sum = multiply.reduce((memo, item) => [memo[0] + item[0], memo[1] + item[1]], [0, 0]);

const area = Math.abs((sum[0] - sum[1]) / 2);

console.log(area);
