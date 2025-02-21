# arcs_cohort
A repository for tracking general tasks/issues, milestones, roadmap, etc. relevant to the overall CSUN ARCS CoHORT project.

## CoHORT System Architecture

```mermaid
flowchart LR
    classDef pkg fill:#dae8fc,stroke:#6c8ebf,stroke-width:1px,color:#000
    classDef node fill:#ffffff,stroke:#999,color:#000,stroke-width:1px
    
    subgraph A[arcs_cohort_core]
      A1("ros2_control / dynamixel_hardware"):::node
      click A1 "[https://github.com/youtalk/dynamixel_control](https://github.com/dynamixel-community/dynamixel_hardware)" "View dynamixel_hardware repo"
    end
    class A pkg
    
    subgraph B[arcs_cohort_sensing]
      B1("zed_camera_node"):::node
      B2("imu_driver_node"):::node
    end
    class B pkg
    
    subgraph C[arcs_cohort_perception]
      C1("perception_node"):::node
    end
    class C pkg
    
    subgraph D[arcs_cohort_navigation]
      D1("planner_server"):::node
      D2("controller_server"):::node
      D3("bt_navigator"):::node
    end
    class D pkg
    
    subgraph E[arcs_cohort_control]
      E1("vel_cmd_bridge"):::node
    end
    class E pkg
    
    subgraph F[arcs_cohort_fleet]
      F1("leader_election_node"):::node
      F2("fleet_coordinator"):::node
    end
    class F pkg
    
    %% Example arrows
    A1 -->|"/odom"| D1
    A1 -->|"/odom"| D2
    D2 -->|"/cmd_vel"| A1
    
    B1 -->|"image topics"| C1
    C1 -->|"obstacles/map"| D1
    
    D2 -->|"/cmd_vel"| E1
    E1 -->|"/cmd_actuator"| A1
    
    F2 -->|"high-level tasks"| D3
    F1 -->|"leader msgs"| F2
    
    B2 -->|"imu data"| C1
```
