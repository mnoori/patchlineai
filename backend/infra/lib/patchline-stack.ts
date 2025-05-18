import { Stack, StackProps, Duration } from "aws-cdk-lib"
import { Construct } from "constructs"
import { aws_ec2 as ec2, aws_ecs as ecs, aws_ecs_patterns as ecsPatterns, aws_ecr_assets as ecrAssets } from "aws-cdk-lib"

export class PatchlineCoreStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // 1. VPC (3 AZs)
    const vpc = new ec2.Vpc(this, "PatchlineVpc", {
      maxAzs: 2,
      natGateways: 1,
    })

    // 2. ECS Cluster
    const cluster = new ecs.Cluster(this, "PatchlineCluster", { vpc })

    // 3. ECR asset (Docker build from backend/app)
    const backendImage = new ecrAssets.DockerImageAsset(this, "BackendImage", {
      directory: "../app",
    })

    // 4. Fargate service + ALB
    new ecsPatterns.ApplicationLoadBalancedFargateService(this, "BackendService", {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      listenerPort: 80,
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(backendImage),
        containerPort: 3001,
        environment: {
          NODE_ENV: "production",
        },
      },
      healthCheckGracePeriod: Duration.minutes(2),
      publicLoadBalancer: true,
    })
  }
} 