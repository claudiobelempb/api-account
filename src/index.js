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

app.get('/statement', verifyIfExistsAccountId, (request, response) => {

  const { customer } = request;

  return response.status(201).json(customer.statement);

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

app.listen(3333, () => {
  console.log(`Server run on port 3333!`);
});