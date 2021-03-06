const { request } = require('express');
const express = require('express')
const { v4: uuid, stringify} = require('uuid');

const app = express();
app.use(express.json());

/**
 * id: string;
 * cpf: string;
 * name: string;
 * statement: [];
 */

const customers = [];

function verifyIfExistsAccountId(request, response, next) {
  const { id }= request.headers;

  const customer = customers.find(customer => customer.id === id);

  if(!customer){
    return response.status(400).json({error: 'Customer already exists in our database'});
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const isBalance = (acc, operation) => (operation.type === 'credit') ? acc += parseInt(operation.amount) : acc -= parseInt(operation.amount);
  const balance = statement.reduce(isBalance, 0);
  return balance;
}

app.get('/account', (request, response) => {
  return response.status(200).json(customers);
});

app.get('/account/:id', verifyIfExistsAccountId, (request, response) => {
  const { id } = request.params;
  console.log(`ID: ${id}`);

  const { customer } = request;

  if(customer.id !== id){
    return response.status(400).json({error: 'Id not found!'});
  }

  return response.json(customer);
});

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const customerExists = customers.some(customer => customer.cpf === cpf);

  if(customerExists){
    return response.status(400).json({error: 'Customer already exists in our database'});
  }

  const customer = {
    id: uuid(),
    cpf,
    name,
    statement: [],
  }

  customers.push(customer);

  return response.status(201).json(customer);
});

app.put('/account', verifyIfExistsAccountId, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).json(customer);
});

app.delete('/account', verifyIfExistsAccountId, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(201).json(customer);
});

app.get('/balance', verifyIfExistsAccountId, (request, response) => {

  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);

});

app.get('/statement', verifyIfExistsAccountId, (request, response) => {

  const { customer } = request;

  return response.status(201).json(customer.statement);

});

app.get('/statement/date', verifyIfExistsAccountId, (request, response) => {

  const { customer } = request;

  const { date } = request.query;

  const dateFormat = new Date(`${date} 00:00`);

  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(statement);

});

app.post('/deposit', verifyIfExistsAccountId, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const customerOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(customerOperation);

  return response.status(201).json(customer);


});

app.post('/withdraw', verifyIfExistsAccountId, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);
  console.log(balance);
  
  if(balance < amount) {
    return response.status(400).json({error: 'Saldo insuficiente'});
  }

  const customerOperation = {
    amount,
    created_at: new Date(),
    type: 'saque'
  }

  customer.statement.push(customerOperation);

  return response.status(201).json({customer, balance});

});

app.listen(3333, () => {
  console.log(`Server run on port 3333!`);
});
