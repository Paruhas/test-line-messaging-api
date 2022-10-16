const { Decimal } = require("decimal.js");

const changeInput = (input) => (new Decimal(input).isNaN() ? 0 : input);

exports.plus = (input1, input2) => {
  input1 = changeInput(input1 || 0);
  input2 = changeInput(input2 || 0);

  let res = new Decimal(input1).plus(input2).toFixed();

  const res_decimalPlaces = new Decimal(res).decimalPlaces();

  if (new Decimal(res_decimalPlaces).greaterThan(8)) {
    res = new Decimal(res).toFixed(8, Decimal.ROUND_DOWN);
  }

  return res;
};

exports.minus = (input1, input2) => {
  input1 = changeInput(input1 || 0);
  input2 = changeInput(input2 || 0);

  let res = new Decimal(input1).minus(input2).toFixed();

  const res_decimalPlaces = new Decimal(res).decimalPlaces();

  if (new Decimal(res_decimalPlaces).greaterThan(8)) {
    res = new Decimal(res).toFixed(8, Decimal.ROUND_DOWN);
  }

  return res;
};

exports.mul = (input1, input2) => {
  input1 = changeInput(input1 || 0);
  input2 = changeInput(input2 || 0);

  let res = new Decimal(input1).mul(input2).toFixed();

  const res_decimalPlaces = new Decimal(res).decimalPlaces();

  if (new Decimal(res_decimalPlaces).greaterThan(8)) {
    res = new Decimal(res).toFixed(8, Decimal.ROUND_DOWN);
  }

  return res;
};

exports.div = (input1, input2) => {
  input1 = changeInput(input1 || 0);
  input2 = changeInput(input2 || 0);

  let res = new Decimal(input1).div(input2).toFixed();

  const res_decimalPlaces = new Decimal(res).decimalPlaces();

  if (new Decimal(res_decimalPlaces).greaterThan(8)) {
    res = new Decimal(res).toFixed(8, Decimal.ROUND_DOWN);
  }

  return res;
};

exports.abs = (input1) => {
  input1 = changeInput(input1 || 0);

  let res = new Decimal(input1).absoluteValue().toFixed();

  const res_decimalPlaces = new Decimal(res).decimalPlaces();

  if (new Decimal(res_decimalPlaces).greaterThan(8)) {
    res = new Decimal(res).toFixed(8, Decimal.ROUND_DOWN);
  }

  return res;
};

/**
 *
 * @param {*} input1 number
 * @param {*} input2 allow decimal (gte 0) / digit (lt 0)
 * @returns
 */
exports.roundDownNumber = (input1, input2) => {
  input1 = changeInput(input1 || 0);
  input2 = changeInput(input2 || 0);

  if (new Decimal(input2).lessThan(0)) {
    const input2_absValue = new Decimal(input2).absoluteValue();

    const digit = new Decimal(10).toPower(input2_absValue);

    return new Decimal(
      new Decimal(new Decimal(input1).toFixed(0, Decimal.ROUND_DOWN))
        .dividedBy(digit)
        .toFixed(0, Decimal.ROUND_DOWN)
    ).mul(digit);
  } else {
    // return new Decimal(input1).toFixed(input2, Decimal.ROUND_DOWN);

    const decimalsPow = new Decimal(10).toPower(input2);

    return new Decimal(
      new Decimal(new Decimal(input1).mul(decimalsPow)).floor()
    ).dividedBy(decimalsPow);
  }
};

/**
 *
 * @param {*} input1 number
 * @param {*} input2 number
 * @param {string} input3 string of operator
 * @returns
 */
exports.OP = (input1, input2, input3) => {
  input1 = changeInput(input1 || 0);
  input2 = changeInput(input2 || 0);

  let res = false;

  switch (input3) {
    case ">":
      res = new Decimal(input1).greaterThan(input2);

      break;

    case ">=":
      res = new Decimal(input1).greaterThanOrEqualTo(input2);

      break;

    case "<":
      res = new Decimal(input1).lessThan(input2);

      break;

    case "<=":
      res = new Decimal(input1).lessThanOrEqualTo(input2);

      break;

    case "=":
      res = new Decimal(input1).equals(input2);

      break;

    case "!=":
      res = new Decimal(input1).equals(input2);
      res = !res;

      break;

    default:
      break;
  }

  return res;
};

exports.getAllowDecimal = (input1) => {
  input1 = changeInput(input1 || 0);

  let res = 0;

  const input1_precision = new Decimal(input1).precision(true);

  switch (true) {
    case new Decimal(input1_precision).greaterThan(1):
      res = new Decimal(new Decimal(input1_precision).minus(1)).negated();
      break;

    default:
      res = new Decimal(input1).decimalPlaces();
      break;
  }

  return res;
};

// FOR res type INTEGER
exports.roundNumber = (input1) => {
  input1 = changeInput(input1 || 0);

  let res = new Decimal(input1).round();
  res = new Decimal(res).toFixed();

  const res_decimalPlaces = new Decimal(res).decimalPlaces();

  if (new Decimal(res_decimalPlaces).greaterThan(8)) {
    // res = new Decimal(res).toFixed(8, Decimal.ROUND_DOWN);
    res = new Decimal(res).toFixed(8);
  }

  return res;
};

// FOR res type FLOAT
exports.roundNumber_decimal = (input1, input2) => {
  input1 = changeInput(input1 || 0);
  input2 = changeInput(input2 || 0);

  let res = new Decimal(input1).toFixed(input2);

  const res_decimalPlaces = new Decimal(res).decimalPlaces();

  if (new Decimal(res_decimalPlaces).greaterThan(8)) {
    // res = new Decimal(res).toFixed(8, Decimal.ROUND_DOWN);
    res = new Decimal(res).toFixed(8);
  }

  return res;
};
