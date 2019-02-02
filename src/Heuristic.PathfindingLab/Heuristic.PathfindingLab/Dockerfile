FROM node:alpine AS typescript
WORKDIR /app
COPY . ./
RUN npm install typescript -g
RUN npm i -s d3
RUN npm i -s @types/d3
RUN tsc -p tsconfig.json

FROM microsoft/dotnet:sdk AS build-env
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY --from=typescript /app/*.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY --from=typescript /app ./
RUN dotnet restore
RUN dotnet bundle
RUN dotnet publish -c Release -o out

# Build runtime image
FROM microsoft/dotnet:aspnetcore-runtime
WORKDIR /app
COPY --from=build-env /app/out .
ENTRYPOINT ["dotnet", "Heuristic.PathfindingLab.dll"]