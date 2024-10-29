import pika

def main():
    credentials = pika.PlainCredentials('user', 'password')
    connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq', 5672, '/', credentials))
    channel = connection.channel()

    # Declare a queue
    channel.queue_declare(queue='hello')

    # Send a message
    message = "Hello, World!"
    channel.basic_publish(exchange='', routing_key='hello', body=message)
    print(f" [x] Sent '{message}'")

    connection.close()

if __name__ == '__main__':
    main()
