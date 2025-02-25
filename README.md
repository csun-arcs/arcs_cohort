# arcs_cohort
A repository for tracking general tasks/issues, milestones, roadmap, etc. relevant to the overall CSUN ARCS CoHORT project.

## CoHORT Project Roadmap

The CoHORT project roadmap can be found [here](https://github.com/orgs/csun-arcs/projects/2).

## CoHORT System Architecture

```mermaid
flowchart LR
    %% ------------------------------------------------------------------------
    %% STYLE DEFINITIONS
    %% ------------------------------------------------------------------------
    classDef pkg fill:#ECECEC,stroke:#666,stroke-width:1px,color:#000,font-weight:bold
    classDef subpkg fill:#F2F2F2,stroke:#999,stroke-width:1px,color:#000,font-weight:bold
    classDef node fill:#FFF,stroke:#444,stroke-width:1px,color:#000

    %% ------------------------------------------------------------------------
    %% arcs_cohort_description
    %% ------------------------------------------------------------------------
    subgraph DESC[arcs_cohort_description]
      desc_urdf["URDF & XACROs"]:::node
      desc_sensors["Sensor Models"]:::node
    end
    class DESC pkg

    %% ------------------------------------------------------------------------
    %% arcs_cohort_bringup
    %% ------------------------------------------------------------------------
    subgraph BRINGUP[arcs_cohort_bringup]
      bringup_launchers["Main Launch Files"]:::node
      bringup_params["Param / YAML Config"]:::node
    end
    class BRINGUP pkg

    %% ------------------------------------------------------------------------
    %% arcs_cohort_core
    %% ------------------------------------------------------------------------
    subgraph CORE[arcs_cohort_core]
      subgraph core_sub[ros2_control + Drivers]
      direction TB
        dyn_hw["dynamixel_hardware<br/>(SystemInterface)"]:::node
        joint_ctrl["velocity_controller<br/> or diff_drive_controller"]:::node
        joint_state_broadcaster["joint_state_broadcaster"]:::node
      end
    end
    class CORE pkg

    %% ------------------------------------------------------------------------
    %% arcs_cohort_control (optional advanced control logic)
    %% ------------------------------------------------------------------------
    subgraph CONTROL[arcs_cohort_control]
      vel_bridge["vel_cmd_bridge"]:::node
      custom_ctrl["(optional) custom logic"]:::node
    end
    class CONTROL pkg

    %% ------------------------------------------------------------------------
    %% arcs_cohort_sensing
    %% ------------------------------------------------------------------------
    subgraph SENSING[arcs_cohort_sensing]
      direction TB

      subgraph scamera[arcs_cohort_camera]
        zed_node["zed_ros2_wrapper"]:::node
      end
      class scamera subpkg

      subgraph simu[arcs_cohort_imu]
        imu_node["vectornav"]:::node
      end
      class simu subpkg

      subgraph slidar[arcs_cohort_lidar]
        lidar_node["velodyne"]:::node
      end
      class slidar subpkg
    end
    class SENSING pkg

    %% ------------------------------------------------------------------------
    %% arcs_cohort_perception
    %% ------------------------------------------------------------------------
    subgraph PERCEPTION[arcs_cohort_perception]
      direction TB
      arcs_cohort_object_detector["arcs_cohort_object_detector"]:::node
      arcs_cohort_mapper["arcs_cohort_mapper"]:::node
    end
    class PERCEPTION pkg

    %% ------------------------------------------------------------------------
    %% arcs_cohort_navigation
    %% Sub-subgraph for Nav2 + costmaps
    %% ------------------------------------------------------------------------
    subgraph NAV[arcs_cohort_navigation]
      direction TB

      subgraph nav2_sub[Nav2 Stack]
      direction TB
        planner_srv["planner_server"]:::node
        controller_srv["controller_server"]:::node
        behavior_srv["behavior_server<br/>(BT Navigator)"]:::node
        global_costmap["global_costmap"]:::node
        local_costmap["local_costmap"]:::node
      end
    end
    class NAV pkg

    %% ------------------------------------------------------------------------
    %% arcs_cohort_fleet
    %% ------------------------------------------------------------------------
    subgraph FLEET[arcs_cohort_fleet]
      fleet_coordinator["fleet_coordinator"]:::node
      leader_election["leader_election_node"]:::node
    end
    class FLEET pkg

    %% ------------------------------------------------------------------------
    %% TOPICS (for one-to-many arrows)
    %% We'll represent major topics as dedicated nodes. We can link them.
    %% ------------------------------------------------------------------------
    odom_topic["/odom"]:::node
    click odom_topic "https://docs.ros.org/en/api/nav_msgs/html/msg/Odometry.html" "Odometry Topic"

    cmd_vel_topic["/cmd_vel"]:::node
    click cmd_vel_topic "http://docs.ros.org/en/api/geometry_msgs/html/msg/Twist.html" "Velocity Command Topic"

    zed_img_topic["/zedM/zed_node/images etc."]:::node
    click zed_img_topic "https://github.com/stereolabs/zed-ros2-wrapper" "ZED Image Topics"

    imu_topic["/vectornav/imu"]:::node
    click imu_topic "http://docs.ros.org/en/api/sensor_msgs/html/msg/Imu.html" "IMU Topic"

    lidar_topic["/velodyne_points"]:::node
    click lidar_topic "https://github.com/ros-drivers/velodyne" "Velodyne PointCloud Topic"

    perception_obstacles["/perception/obstacles or map"]:::node
    click perception_obstacles "#" "Custom messages"

    fleet_goals["/fleet/goals"]:::node
    click fleet_goals "#" "Fleet-level task commands"

    %% ------------------------------------------------------------------------
    %% EDGES / DATA FLOW
    %% ------------------------------------------------------------------------

    %% DESCRIPTION -> CORE
    desc_urdf -- references --> core_sub
    desc_sensors -- references --> core_sub
    bringup_launchers --launches--> core_sub
    bringup_launchers --launches--> zed_node
    bringup_launchers --launches--> imu_node
    bringup_launchers --launches--> lidar_node
    bringup_params --param_configures--> core_sub

    %% arcs_cohort_core producing /odom from diff drive
    joint_ctrl --> odom_topic
    dyn_hw --> joint_ctrl
    joint_state_broadcaster --> joint_ctrl

    %% arcs_cohort_navigation consumes /odom
    odom_topic --> planner_srv
    odom_topic --> controller_srv
    odom_topic --> behavior_srv
    odom_topic --> global_costmap
    odom_topic --> local_costmap

    %% arcs_cohort_navigation publishes /cmd_vel
    controller_srv --> cmd_vel_topic

    %% arcs_cohort_control bridging
    cmd_vel_topic --> vel_bridge
    vel_bridge --> dyn_hw
    custom_ctrl --> dyn_hw

    %% arcs_cohort_sensing -> arcs_cohort_perception
    zed_node --> zed_img_topic
    zed_img_topic --> arcs_cohort_object_detector
    zed_img_topic --> arcs_cohort_mapper

    imu_node --> imu_topic
    imu_topic --> arcs_cohort_mapper

    lidar_node --> lidar_topic
    lidar_topic --> arcs_cohort_mapper
    lidar_topic --> arcs_cohort_object_detector

    %% arcs_cohort_perception -> obstacles / map
    arcs_cohort_object_detector --> perception_obstacles
    arcs_cohort_mapper --> perception_obstacles

    %% arcs_cohort_navigation consumes /perception
    perception_obstacles --> global_costmap
    perception_obstacles --> local_costmap
    perception_obstacles --> planner_srv

    %% arcs_cohort_fleet
    fleet_coordinator --> fleet_goals
    leader_election --> fleet_coordinator
    fleet_goals --> behavior_srv

    %% Possibly behavior server interacts with planner / controller
    behavior_srv --> planner_srv
    behavior_srv --> controller_srv
```
