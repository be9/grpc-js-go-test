.PHONY: proto
proto:
	@protoc --go_out=. --go_opt=paths=source_relative \
        --go-grpc_out=. --go-grpc_opt=paths=source_relative \
        proto/testservice/testservice.proto

.PHONY: server
server:
	@go run server/main.go

.PHONY: prettier
prettier:
	@npx prettier -w .