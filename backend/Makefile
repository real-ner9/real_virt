rebuild-frontend:
    # Останавливаем и удаляем контейнеры
    docker compose -f ./docker/docker-compose.yml down

    # Удаляем volume frontend-dist
    docker volume rm frontend-dist

    # Пересоздаем контейнеры и volume
    COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f ./docker/docker-compose.yml up -d --build

redeploy:
	# Строим новые образы
	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f ./docker/docker-compose.yml build

	# Перезапускаем контейнеры с новыми образами
	docker compose -f ./docker/docker-compose.yml up -d

up:
	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f ./docker/docker-compose.yml up -d --build --remove-orphans

down:
	docker compose -f ./docker/docker-compose.yml down

stop:
	docker compose -f ./docker/docker-compose.yml stop



up-local:
	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f ./docker/docker-compose.local.yml up -d --build --remove-orphans

down-local:
	docker compose -f ./docker/docker-compose.local.yml down

stop-local:
	docker compose -f ./docker/docker-compose.local.yml stop
