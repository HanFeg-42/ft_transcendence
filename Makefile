NAME = pacova
DOCKER_COMPOSE = docker compose
SERVICES = frontend api-gateway auth game


all: build up

# Build Docker images
build:
	$(DOCKER_COMPOSE) build

# Start containers in detached mode
up:
	$(DOCKER_COMPOSE) up -d

# Stop running containers
down:
	$(DOCKER_COMPOSE) down

# Restart containers
restart: down up

# View running containers status
status:
	$(DOCKER_COMPOSE) ps

# View container logs
logs:
	$(DOCKER_COMPOSE) logs -f

clean: down
	$(DOCKER_COMPOSE) down -v

# Full cleanup: Wipe Docker images/cache and local node_modules (KEEPS package-lock.json!)
fclean: clean
	@echo "Cleaning up local node_modules and Docker cache..."
	@for dir in $(SERVICES); do \
		rm -rf $$dir/node_modules; \
	done
	docker system prune -af --volumes
	@echo "Full cleanup complete."

re: fclean up

.PHONY: all build up down restart status logs clean fclean