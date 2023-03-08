package main

import (
	"context"
	"flag"
	"fmt"
	"github.com/be9/grpc-js-go-test/server/util"
	"log"
	"net"

	pb "github.com/be9/grpc-js-go-test/proto/testservice"
	"google.golang.org/grpc"
)

var (
	port = flag.Int("port", 50051, "The server port")
)

type server struct {
	pb.UnimplementedTestServiceServer
}

func genDetails(n int) []string {
	strings := make([]string, n)
	for i := range strings {
		strings[i] = util.RandStringBytesMask(50)
	}
	return strings
}

func (s *server) GetFoos(context.Context, *pb.GetFoosRequest) (*pb.GetFoosResponse, error) {
	foos := make([]*pb.Foo, 10)
	for i := range foos {
		foos[i] = &pb.Foo{
			Id:      fmt.Sprintf("%d", i),
			Details: genDetails(5),
		}
	}
	return &pb.GetFoosResponse{Foos: foos}, nil
}

func (s *server) GetFoobars(context.Context, *pb.GetFoobarsRequest) (*pb.GetFoobarsResponse, error) {
	foobars := make([]*pb.Foobar, 10)
	for i := range foobars {
		foobars[i] = &pb.Foobar{
			Id:      fmt.Sprintf("%d", i),
			Details: genDetails(10),
		}
	}
	return &pb.GetFoobarsResponse{Foobars: foobars}, nil
}

func main() {
	flag.Parse()
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterTestServiceServer(s, &server{})
	log.Printf("server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
