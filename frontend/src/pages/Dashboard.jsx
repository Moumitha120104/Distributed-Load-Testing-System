import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { useTestID } from '../context/TestIDContext';
import "./Dashboard.scss"

const Dashboard = () => {
  const [nodeStats, setNodeStats] = useState({});
  const [finalStats, setFinalStats] = useState({});
  const { testID, setTestID} = useTestID();

  const CurTestID = useMemo(() => testID, [testID]);
  useEffect(() => {
    setFinalStats(null)
    trigger();
    // eslint-disable-next-line
  }, [testID]);

  const trigger = async () => {
    if(testID != null) {
      try {
        await axios.post("http://localhost:8080/trigger", {"TestID": testID});
        // const res = await axios.post("http://localhost:8080/trigger");
        // console.log(testID);
        // console.log(res);
      } catch (err) {
        console.log(err);
      }
    }
  };

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws');

    socket.onmessage = (event) => {
      const parsed_json = JSON.parse(event.data);
      const numKeyValuePairs = Object.keys(parsed_json).length;


      if(numKeyValuePairs == 2) {
        console.log(numKeyValuePairs, parsed_json)
        const {test_id, metrics} = parsed_json;
        if(test_id == testID) {
          setFinalStats(metrics)
          console.log("Final", metrics)
          setTestID(null)
          console.log(finalStats)
          return () => {
            socket.close();
          };
        }
      }

      const { TestID, NodeID, TotalRequests, MeanLatency, MinLatency, MaxLatency } = parsed_json;
      // console.log(parsed_json)
      if (testID === TestID) {
        setNodeStats((prevNodeStats) => {
          // Update the stats for the specific NodeID
          return {
            ...prevNodeStats,
            [NodeID]: {
              mean: parseFloat(MeanLatency).toFixed(2),
              min: MinLatency,
              max: MaxLatency,
              total: TotalRequests,
            },
          };
        });
      }
    };

    return () => {
      // Clean up the WebSocket connection when the component unmounts
      socket.close();
    };
  }, [testID]);

  return (
    <div className='dashboard'>
      <h1>Test Results</h1>
      <h2> Test ID: {CurTestID} </h2>
      {finalStats ? <h3> Test Complete </h3> : <h3> Test in Progress</h3>}
      <div>
        {finalStats && (
          <div className='finalstats'>
            <h2> Final Statistics </h2>
            <p>Minimum Latency: {finalStats.MinLatency}</p>
            <p>Maximum Latency: {finalStats.MaxLatency}</p>
            <p>Mean Latency: {finalStats.MeanLatency}</p> {/* Corrected property name */}
            <p>Number of Driver Nodes: {finalStats.NumNodes}</p>
          </div>
        )}
      </div>
      <div className='nodestats'>
        <h2>Driver Node Statistics</h2>
        {Object.keys(nodeStats).map((nodeID) => (
          <div key={nodeID} className='nodeDetails'>
            <span>Node ID: {nodeID}</span>
            <div className='metrics'>
              <p>Mean Latency: {nodeStats[nodeID].mean}</p>
              <p>Min Latency: {nodeStats[nodeID].min}</p>
              <p>Max Latency: {nodeStats[nodeID].max}</p>
              <p>Total Requests: {nodeStats[nodeID].total}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
