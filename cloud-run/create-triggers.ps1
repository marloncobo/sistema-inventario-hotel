param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [string]$Region = "us-central1",
    [string]$RepoOwner = "marloncobo",
    [string]$RepoName = "sistema-inventario-hotel",
    [string]$RepositoryResource = "",
    [string]$BranchPattern = "^frontendv3$",
    [string]$Repository = "hotel-inventory",
    [string]$Tag = "latest",
    [string]$ServiceAccount = "112685788555-compute@developer.gserviceaccount.com",
    [switch]$RequireApproval,
    [string]$InventoryEnvFile = "cloud-run/env.inventory.yaml",
    [string]$RoomsEnvFile = "cloud-run/env.rooms.yaml",
    [string]$GatewayEnvFile = "cloud-run/env.gateway.yaml"
)

$ErrorActionPreference = "Stop"

gcloud config set project $ProjectId | Out-Null

$commonArgs = @(
    "--region=$Region",
    "--branch-pattern=$BranchPattern",
    "--include-logs-with-status"
)

if ($RepositoryResource) {
    $commonArgs += "--repository=$RepositoryResource"
}
else {
    $commonArgs += @(
        "--repo-owner=$RepoOwner",
        "--repo-name=$RepoName"
    )
}

if ($ServiceAccount) {
    $commonArgs += "--service-account=$ServiceAccount"
}

if ($RequireApproval) {
    $commonArgs += "--require-approval"
}

$triggers = @(
    @{
        Name = "deploy-inventory-service"
        Description = "Build and deploy inventory-service to Cloud Run"
        BuildConfig = "cloud-run/cloudbuild.inventory.yaml"
        EnvFile = $InventoryEnvFile
        IncludedFiles = @(
            "pom.xml",
            "inventory-service/**",
            "cloud-run/cloudbuild.inventory.yaml"
        )
    },
    @{
        Name = "deploy-rooms-service"
        Description = "Build and deploy rooms-service to Cloud Run"
        BuildConfig = "cloud-run/cloudbuild.rooms.yaml"
        EnvFile = $RoomsEnvFile
        IncludedFiles = @(
            "pom.xml",
            "rooms-service/**",
            "cloud-run/cloudbuild.rooms.yaml"
        )
    },
    @{
        Name = "deploy-gateway-service"
        Description = "Build and deploy gateway-service to Cloud Run"
        BuildConfig = "cloud-run/cloudbuild.gateway.yaml"
        EnvFile = $GatewayEnvFile
        IncludedFiles = @(
            "pom.xml",
            "gateway-service/**",
            "cloud-run/cloudbuild.gateway.yaml"
        )
    }
)

foreach ($trigger in $triggers) {
    $includedFiles = $trigger.IncludedFiles + @($trigger.EnvFile)
    $args = @(
        "builds", "triggers", "create", "github",
        "--name=$($trigger.Name)",
        "--description=$($trigger.Description)",
        "--build-config=$($trigger.BuildConfig)",
        "--included-files=$($includedFiles -join ",")",
        "--substitutions=_REGION=$Region,_REPOSITORY=$Repository,_TAG=$Tag,_ENV_VARS_FILE=$($trigger.EnvFile)"
    ) + $commonArgs

    Write-Host "Creating trigger $($trigger.Name)..."
    & gcloud @args
}
