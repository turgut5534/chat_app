
const socket = io()

socket.on('message', (data) => {
    
    console.log(data)
    const p = document.createElement('p')
    p.textContent = data.message
    const div = document.querySelector('.messages')
    div.appendChild(p)

})


const id = document.querySelector('#user-id').value
const recipient_id = document.querySelector('#recipient-id').value

document.querySelector('#send-button').addEventListener('click', function() {

    const message = document.querySelector('#message-input').value

    sendMessage({ id: id , recipient_id: recipient_id, message: message})

})

function sendMessage(data) {
    $.post('http://localhost:3000/message', data)
}

