const todoService = require('../services/todoService');

async function create(req, res, next) {
  try {
    res.status(201).json(await todoService.create(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    res.status(200).json(await todoService.list(req.user.id, req.query));
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    res.status(200).json(await todoService.getOne(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.status(200).json(await todoService.update(req.user.id, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await todoService.remove(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
