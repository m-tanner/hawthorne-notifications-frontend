APP_NAME := "hawthorne-notifications"
GCP_ARTIFACT_PREFIX := "us-west1-docker.pkg.dev"
GCP_ARTIFACT_REPO := "$(APP_NAME)-repo"
GCP_ARTIFACT_NAME := "$(APP_NAME)-frontend"
GO_FILES := $(shell find . -name '*.go' -not -path "./vendor/*")
GOFMT := $(shell gofmt -l $(GO_FILES))
GOFLAGS :=
COMMIT_SHA := $(shell git rev-parse --short HEAD)
BREW_PREFIX := $(shell brew --prefix)

# Targets
.PHONY: all check-env setup login build run test perf fmt vet lint clean deploy help

# Default target: run all tasks
all: clean fmt vet lint test build deploy ## Run all tasks (clean, fmt, vet, lint, test, build, deploy)

check-env: ## Check environment variables
	@if [ -z "$(GOOGLE_APPLICATION_CREDENTIALS)" ]; then echo "Error: GOOGLE_APPLICATION_CREDENTIALS is not set"; exit 1; fi
	@if [ -z "$(GMAIL_PASSWORD)" ]; then echo "Error: GMAIL_PASSWORD is not set"; exit 1; fi
	@if [ -z "$(GOPROXY)" ] || [ "$(GOPROXY)" = "direct" ]; then \
			echo "GOPROXY is set correctly."; \
		else \
			echo "Error: GOPROXY is not set to 'direct' or empty"; \
			exit 1; \
		fi

setup: ## Set up development dependencies
	@echo "==> Setting up development dependencies..."
	@if gcloud --version; then \
		echo "gcloud is installed. Stopping."; \
        exit 0; \
	else \
		echo "gcloud is not installed. Installing..."; \
		brew --version; \
		brew install direnv; \
		direnv allow; \
		brew install google-cloud-sdk; \
		gcloud init; \
	fi

login: ## Log in to gcloud CLI
	@echo "==> Logging in for gcloud cli..."
	gcloud auth login
	gcloud auth configure-docker $(GCP_ARTIFACT_PREFIX)

build: check-env test ## Build the application
	@echo "==> Building the application..."
	go build -o out/$(APP_NAME) $(GOFLAGS) cmd/main.go

run: check-env ## Run the application locally
	@echo "==> Running the application locally..."
	go run cmd/main.go

perf: check-env ## Run performance testing locally
	@echo "==> Running performance testing locally..."
	go run cmd/performance_startup.go
	go run cmd/performance_load.go

test: check-env lint ## Run tests
	@echo "==> Running tests..."
	go test -v ./...

fmt: ## Format the code
	@echo "==> Formatting Go files..."
	@gofmt -w $(GO_FILES)
	@if [ -n "$(GOFMT)" ]; then \
		echo "Go files must be formatted with gofmt:"; \
		echo "$(GOFMT)"; \
		exit 1; \
	fi

vet: fmt ## Vet the code
	@echo "==> Vetting Go files..."
	go vet ./...

lint: vet ## Lint the code
	@echo "==> Linting Go files..."
	@golangci-lint run

clean: ## Clean up the build artifacts
	@echo "==> Cleaning up..."
	@rm -f $(APP_NAME)

deploy: build ## Deploy to Google Cloud Functions
	@echo "==> Building image with commit SHA $(COMMIT_SHA) and pushing to Google Artifact Registry..."
	docker build --platform linux/amd64 -t $(GCP_ARTIFACT_NAME):$(COMMIT_SHA) .
	docker tag $(GCP_ARTIFACT_NAME):$(COMMIT_SHA) $(GCP_ARTIFACT_PREFIX)/$(APP_NAME)/$(GCP_ARTIFACT_REPO)/$(GCP_ARTIFACT_NAME):latest
	docker push $(GCP_ARTIFACT_PREFIX)/$(APP_NAME)/$(GCP_ARTIFACT_REPO)/$(GCP_ARTIFACT_NAME):latest
	# deployment on Google Cloud Run is automatic on commit to `main` branch

help: ## Display this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
