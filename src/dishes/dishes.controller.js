const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next) {
    res.send({data: dishes});
}

function create(req, res, next) {
    const {name, description, price, image_url} = req.body.data;
    let newId = nextId();
    const newDish = {
        name,
        description,
        price,
        image_url,
        id: newId
    };
    dishes.push(newDish);
    res.status(201).send({data: newDish});
}

function read(req, res, next) {
    const { dish } = res.locals;
    res.send({ data: dish })
  }

  function update(req, res, next) {
    const {dishId} = req.params;
    const {name, description, price, image_url} = req.body.data;
    const updatedDish = {
        name,
        description,
        price,
        image_url,
        id: dishId
    };
    dishes[res.locals.index] = updatedDish;
    res.status(200).send({data: updatedDish});
  }



//middleware
function validateDataExists(req, res, next) {
    if (req.body.data) {
      next();
    } else {
      next({
        status: 400,
        message: "Please include a data object in your request body."
      })
    }
  }
  
  function createValidatorFor(field) {
    return function (req, res, next) {
      if (req.body.data[field] && req.body.data[field] !== "") {
        next();
      } else {
        next({
          status: 400,
          message: `Dish must include a ${field}`
        })
      }
    }
  }
  function validatePrice(req, res, next) {
    const {price} = req.body.data;
    if(price && price > 0 && typeof price === "number") {
        next();
    }
    else {
        next({status: 400, message: `Dish must have a price that is an integer greater than 0`})
    }
    
  }

  function validateExists(req, res, next) {
    let {dishId} = req.params;
    let index = dishes.findIndex(dish => dish.id === req.params.dishId);
    if(index > -1) {
        let dish = dishes[index];
        res.locals.dish = dish;
        res.locals.index = index;
        next();
    }
    else {
        next({
            status: 404,
            message: `Dish does not exist: ${dishId}`
          })
    }
  }

  function validateId(req, res, next) {
    const {dishId} = req.params;
    const {id} = req.body.data;
    if(id) {
        if(id !== dishId) {
            next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});
        }
        else {
            next();
        }
    }
    else {
        next();
    }
  }


let fields = ["name", "description", "image_url"];
module.exports = {
    list,
    create: [validateDataExists, ...fields.map(createValidatorFor), validatePrice, create],
    read: [validateExists, read],
    update: [validateExists, validateDataExists, ...fields.map(createValidatorFor), validatePrice, validateId, update]
    
  }