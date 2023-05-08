const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
  res.status(200).send({ data: orders });
}

function create(req, res, next) {
  const { deliverTo, mobileNumber, status, dishes } = req.body.data;
  let newId = nextId();
  const newOrder = {
    deliverTo,
    mobileNumber,
    status,
    dishes,
    id: newId,
  };
  orders.push(newOrder);
  res.status(201).send({ data: newOrder });
}

function read(req, res, next) {
  const { order } = res.locals;
  res.send({ data: order });
}

function destroy(req, res, next) {
  let { index } = res.locals;
  orders.splice(index, 1);
  res.status(204).send();
}

function update(req, res, next) {
  const { orderId } = req.params;
  const { deliverTo, mobileNumber, status, dishes } = req.body.data;
  const updatedOrder = {
    deliverTo,
    mobileNumber,
    status,
    dishes,
    id: orderId,
  };
  orders[res.locals.index] = updatedOrder;
  res.status(200).send({ data: updatedOrder });
}

// middleware

function validateExists(req, res, next) {
  let { orderId } = req.params;
  let index = orders.findIndex((order) => order.id === req.params.orderId);
  if (index > -1) {
    let order = orders[index];
    res.locals.order = order;
    res.locals.index = index;
    next();
  } else {
    next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  }
}

function createValidatorFor(field) {
  return function (req, res, next) {
    if (req.body.data[field] && req.body.data[field] !== "") {
      next();
    } else {
      next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  };
}
function validateDataExists(req, res, next) {
  if (req.body.data) {
    next();
  } else {
    next({
      status: 400,
      message: "Please include a data object in your request body.",
    });
  }
}

function validateDishesArray(req, res, next) {
  const { dishes } = req.body.data;
  if (Array.isArray(dishes) && dishes.length > 0) {
    next();
  } else {
    next({ status: 400, message: `Order must include at least one dish` });
  }
}
function validateDishes(req, res, next) {
  const { dishes } = req.body.data;
  dishes.forEach((dish, i) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      typeof dish.quantity !== "number"
    ) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function validatePending(req, res, next) {
  const { status } = orders[res.locals.index];
  if (status !== "pending") {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`,
    });
  } else {
    next();
  }
}

function validateStatus(req, res, next) {
    const {data:{status}}={}=req.body;
  if (status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be changed" });
  } else if (!status || status === "") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else if(status === "pending" || status === "preparing" || status === "out-for-delivery") {
    next();
  }
  else {
    next({
        status: 400,
        message:
          "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });
  }
}

function validateId(req, res, next) {
  const { orderId } = req.params;
  const { id } = req.body.data;
  if (id) {
    if (id !== orderId) {
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
    } else {
      next();
    }
  } else {
    next();
  }
}

let fields = ["deliverTo", "mobileNumber", "dishes"];
module.exports = {
  list,
  create: [
    validateDataExists,
    ...fields.map(createValidatorFor),
    validateDishesArray,
    validateDishes,
    create,
  ],
  read: [validateExists, read],
  destroy: [validateExists, validatePending, destroy],
  update: [
    validateExists,
    validateDataExists,
    ...fields.map(createValidatorFor),
    validateStatus,
    validateId,
    validateDishesArray,
    validateDishes,
    update,
  ],
};
