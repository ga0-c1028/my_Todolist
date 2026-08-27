const categoryService = require('../services/categoryService');

async function list(req, res, next) {
  try {
    res.status(200).json(await categoryService.list(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await categoryService.create(req.user.id, req.body.name));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.status(200).json(await categoryService.update(req.user.id, req.params.id, req.body.name));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await categoryService.remove(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
