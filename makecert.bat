openssl genrsa 1024 > key.pem
openssl req -x509 -new -key key.pem > key-cert.pem
