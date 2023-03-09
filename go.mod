module github.com/be9/grpc-js-go-test

go 1.18

require (
	golang.org/x/net v0.5.0
	google.golang.org/grpc v1.53.0
	google.golang.org/protobuf v1.28.1
)

require (
	github.com/golang/protobuf v1.5.2 // indirect
	golang.org/x/sys v0.4.0 // indirect
	golang.org/x/text v0.6.0 // indirect
	google.golang.org/genproto v0.0.0-20230110181048-76db0878b65f // indirect
)

replace google.golang.org/grpc v1.53.0 => github.com/be9/grpc-go v0.0.0-20230309070825-c1951b6bc872
