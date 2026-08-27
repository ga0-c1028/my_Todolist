module.exports = function validate(validatorFn) {
  return (req, res, next) => {
    try {
      validatorFn(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
};
