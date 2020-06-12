'use strict'

let mealsState = []

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

    return stringToHtml( `<li data-id="${order._id}">${meal.name} - ${order.user_id}</li>`)
}

window.onload = () => {
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
            user_id: 'chanchito feliz'
        }

        fetch('https://almuerzi-api.now.sh/api/orders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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

    fetch('https://almuerzi-api.now.sh/api/meals')
        .then(response => response.json())
        .then(mealsData => {
            mealsState = mealsData

            const mealsList = document.getElementById('meals-list')
            mealsList.removeChild(mealsList.firstElementChild)

            const listItems = mealsData.map(renderItem)
            listItems.forEach(element => mealsList.appendChild(element))

            const submit = document.getElementById('submit')
            submit.removeAttribute('disabled')

            fetch('https://almuerzi-api.now.sh/api/orders')
                .then(response => response.json())
                .then(ordersData => {
                    const ordersList = document.getElementById('orders-list')
                    ordersList.removeChild(ordersList.firstElementChild)

                    const listOrders = ordersData.map(orderData => renderOrder(orderData, mealsData))
                    listOrders.forEach(element => ordersList.appendChild(element))
                })
        })
}
