'use strict'

let mealsState = []
let route = 'login' // login, register, orders
let user = {}
let SERVER = 'https://almuerzi-api.netlify.app/.netlify/functions/api'
//let SERVER = 'http://localhost:3000/.netlify/functions/api'

const stringToHtml = (string) => {
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(string, 'text/html')

    return htmlDoc.body.firstChild
}

const renderItem = (item) => {
    const element = stringToHtml( `<li data-id="${item._id}">${item.name}</li>`)

    element.addEventListener('click', (e) => {
        const mealsList = document.getElementById('meals-list')
        Array.from(mealsList.children).forEach(element => element.classList.remove('selected'))
        element.classList.add('selected')

        const mealsIdInput = document.getElementById('meal-id')
        mealsIdInput.value = item._id
    })

    return element
}

const renderOrder = (order, meals) => {
    const meal = meals.find(meal => meal._id === order.meal_id)

    return stringToHtml( `<li data-id="${order._id}">${meal.name} - ${order._id}</li>`)
}

const renderApp = () => {
    const token = localStorage.getItem('token')
    if (token && token.trim().length > 0) {
        user = JSON.parse(localStorage.getItem('user'))
        return renderOrders()
    }

    renderLogin()
}

const renderOrders = () => {
    const ordersView = document.getElementById('orders-view')
    document.getElementById('app').innerHTML = ordersView.innerHTML

    initializeOrdersForm()
    initializeMealsAndOrders()
}

const renderLogin = () => {
    const loginView = document.getElementById('login-view')
    document.getElementById('app').innerHTML = loginView.innerHTML

    const loginForm = document.getElementById('login-form')
    loginForm.onsubmit = (e) => {
        e.preventDefault()

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        if (new String(email).trim().length === 0) {
            alert('You have to write a email.')
            return
        }

        if (new String(email).indexOf('@') === -1) {
            alert('You have to write a valid email.')
            return
        }

        if (new String(password).trim().length === 0) {
            alert('You have to write a password.')
            return
        }

        fetch(`${SERVER}/auth/login`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        })
            .then(data => data.json())
            .then(response => {
                localStorage.setItem('token', response.token)
                route = 'orders'

                return response.token
            })
            .then(token => {
                return fetch(`${SERVER}/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token,
                    }
                })
            })
            .then(response => response.json())
            .then(userData => {
                user = userData
                localStorage.setItem('user', JSON.stringify(userData))
                renderOrders()
            })
    }
}

const initializeOrdersForm = () => {
    const orderForm = document.getElementById('order')
    orderForm.onsubmit = (e) => {
        e.preventDefault()
        const submit = document.getElementById('submit')
        submit.setAttribute('disabled', true)

        const mealIdValue = document.getElementById('meal-id').value

        if (!mealIdValue) {
            alert('Debe seleccionar un platillo.')
            return
        }

        const order = {
            meal_id: mealIdValue,
            user_id: user._id,
        }

        fetch(`${SERVER}/orders/`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify(order)
        })
            .then(response => response.json())
            .then(ordersData => {
                const renderedOrder = renderOrder(ordersData, mealsState)
                const ordersList = document.getElementById('orders-list')

                ordersList.appendChild(renderedOrder)
                submit.removeAttribute('disabled')
            })
    }
}

const initializeMealsAndOrders = () => {
    fetch(`${SERVER}/meals`, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(mealsData => {
            mealsState = mealsData

            const mealsList = document.getElementById('meals-list')
            mealsList.removeChild(mealsList.firstElementChild)

            const listItems = mealsData.map(renderItem)
            listItems.forEach(element => mealsList.appendChild(element))

            const submit = document.getElementById('submit')
            submit.removeAttribute('disabled')

            fetch(`${SERVER}/orders`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(ordersData => {
                    const ordersList = document.getElementById('orders-list')
                    ordersList.removeChild(ordersList.firstElementChild)

                    const listOrders = ordersData.map(orderData => renderOrder(orderData, mealsData))
                    listOrders.forEach(element => ordersList.appendChild(element))
                })
        })
}

window.onload = () => {
    renderApp()
}
