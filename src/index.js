const express = require('express')
const {v4: uuid} = require('uuid')
const app = express()

app.use(express.json())

const customers = []

/**
 * A middleware to check if customer exists
 */
const isCustomerExist = (req, res, next) => {
    const {cpf} = req.headers;
    const customer = customers.find((customer) => customer.cpf === cpf);
    if (!customer) {
        return res.status(400).json({error: 'Customer not found'})
    }
    /**
     * creating a request that is called customer
     * all the functions that receive this middleware
     * will have an access to the customer request
     * which has a customer object
     */
    req.customer = customer;
    return next()
}

const getBalance = (statement) => {
    return statement.reduce((acc, operation) => {
        if (operation.type === 'deposit') {
            console.log('deposit', acc, operation)
            return acc + operation.amount
        } else {
            console.log('wid', acc, operation)
            return acc - operation.amount
        }
    }, 0)
}

/**
 * cpf - string
 * name - string6
 * id - uuid
 * statement - []
 */
app.post('/account', ((req, res) => {
    const {cpf, name} = req.body;
    customers.push({id: uuid(), name, cpf, bankStatement: []})
    return res.status(201).send()
}))

/**
 * all the code that is below the app.use
 * will use the middleware
 */
// app.use(isCustomerExist)

/**
 * this middleware is applied only for this route
 */
app.get('/bankStatement', isCustomerExist, ((req, res) => {
    const {customer} = req;
    return res.status(200).json(customer)
}))

app.post('/deposit', isCustomerExist, (req, res) => {
    const {description, amount} = req.body;
    const {customer} = req;

    const deposit = {
        description,
        amount,
        created_at: new Date(),
        type: 'deposit'
    }

    customer.bankStatement.push(deposit)

    return res.status(201).send();
})

app.post('/withdraw', isCustomerExist, ((req, res) => {
    const {amount} = req.body;
    const {customer} = req;

    const balance = getBalance(customer.bankStatement)

    if (balance < amount) {
        return res.status(400).json({error: 'insufficient balance'})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'withdraw'
    }

    customer.bankStatement.push(statementOperation)

    return res.status(201).send();
}))

app.get('/statement/date', isCustomerExist, ((req, res) => {
    const {customer} = req;
    const {date} = req.query;
    const dateFormat = new Date(date + " 00:00");
    const statement = customer.bankStatement.filter((statement) =>
        statement.created_at.toDateString() === new Date(dateFormat).toDateString())
    return res.status(200).json(statement)
}))

app.put("/account", isCustomerExist, (req, res) => {
    const {name} = req.body;
    const {customer} = req;
    customer.name = name;
    return res.status(201).send();
})

app.get("/account", isCustomerExist, (req, res) => {
    const {customer} = req;
    return res.status(200).json(customer)
})

app.delete("/account", isCustomerExist, (req, res) => {
    const {customer} = req;
    console.log('customer', customer)
    customers.splice(customer, 1)
    return res.status(200).json(customer);
})

app.get("/balance", isCustomerExist, (req, res) => {
    const {customer} = req;
    const balance = getBalance(customer.bankStatement)
    return res.json(balance);
})

app.listen(3333)
