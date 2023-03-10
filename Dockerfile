FROM golang:1.20

WORKDIR /usr/src/app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY server ./server
COPY proto ./proto
RUN go build -v -o /usr/local/bin/testservice server/main.go

CMD ["testservice"]
