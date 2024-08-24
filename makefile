GCP_PROJECT_NAME := hawthorne-notifications
GCP_ARTIFACT_PREFIX := "us-west1-docker.pkg.dev"
GCP_ARTIFACT_REPO := "$(GCP_PROJECT_NAME)-repo"
GCP_ARTIFACT_NAME := "$(GCP_PROJECT_NAME)-frontend"
COMMIT_SHA := $(shell git rev-parse --short HEAD)
BREW_PREFIX := $(shell brew --prefix)

# Targets
.PHONY: all check-env setup install login build ci run clean deploy help

# Default target: run all tasks
all: clean install deploy ## Run all tasks (clean, lint, test, build, deploy)

check-env: ## Check environment variables
	@if [ -z "$(GOOGLE_APPLICATION_CREDENTIALS)" ]; then echo "Error: GOOGLE_APPLICATION_CREDENTIALS is not set"; exit 1; fi
	@if [ -z "$(GMAIL_PASSWORD)" ]; then echo "Error: GMAIL_PASSWORD is not set"; exit 1; fi

setup: ## Set up development dependencies
	@echo "==> Setting up development dependencies..."
	@if gcloud --version; then \
		echo "gcloud is installed. Stopping."; \
        exit 0; \
	else \
		echo "gcloud is not installed. Continuing..."; \
		brew --version; \
		brew install direnv; \
		direnv allow; \
		brew install google-cloud-sdk; \
		gcloud init; \
	fi

install: ## Set up npm dependencies
	@echo "==> Installing npm dependencies..."
	npm install

login: ## Log in to gcloud CLI
	@echo "==> Logging in for gcloud cli..."
	gcloud auth login
	gcloud auth configure-docker $(GCP_ARTIFACT_PREFIX)

build: check-env ## Build the application
	@echo "==> Building the application..."
	npm run build

ci: check-env
	@echo ""
	npm ci

run: check-env ## Run the application locally
	@echo "==> Running the application locally..."
	npm start

clean: ## Clean up the build artifacts
	@echo "==> Cleaning up..."
	rm -rf dist

rm-package-lock: ## Remove the package-lock.json file
	@echo "==> Removing package-lock.json..."
	rm package-lock.json
	rm -rf node_modules

deploy: ## Deploy to Google Cloud Functions
	@echo "==> Building image with commit SHA $(COMMIT_SHA) and pushing to Google Artifact Registry..."
	docker build --build-arg REACT_APP_FRONTEND_BASE_URL=https://hawthornestereo.news --platform linux/amd64 -t $(GCP_ARTIFACT_NAME):$(COMMIT_SHA) .
	docker tag $(GCP_ARTIFACT_NAME):$(COMMIT_SHA) $(GCP_ARTIFACT_PREFIX)/$(GCP_PROJECT_NAME)/$(GCP_ARTIFACT_REPO)/$(GCP_ARTIFACT_NAME):latest
	docker push $(GCP_ARTIFACT_PREFIX)/$(GCP_PROJECT_NAME)/$(GCP_ARTIFACT_REPO)/$(GCP_ARTIFACT_NAME):latest
	# deployment on Google Cloud Run is automatic on commit to `main` branch

help: ## Display this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
