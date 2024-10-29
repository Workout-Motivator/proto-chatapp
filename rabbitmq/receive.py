import pika

def main():
    credentials = pika.PlainCredentials('user', 'password')
    connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq', 5672, '/', credentials))
    channel = connection.channel()

    # Declare a queue
    channel.queue_declare(queue='hello')

    # Define the callback to process received messages
    def callback(ch, method, properties, body):
        print(f" [x] Received '{body.decode()}'")

    # Consume messages from the queue
    channel.basic_consume(queue='hello', on_message_callback=callback, auto_ack=True)

    print(' [*] Waiting for messages. To exit press CTRL+C')
    channel.start_consuming()

if __name__ == '__main__':
    main()
