/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  Vehicle,
  VehicleCreateInput,
  VehicleDetail,
  VehicleDocument,
  VehicleDocumentCreateInput,
  VehicleDocumentListResponse,
  VehicleHistoryEvent,
  VehicleHistoryEventCreateInput,
  VehicleHistoryListResponse,
  VehicleKind,
  VehicleListResponse,
  VehicleUpdateInput,
} from "./data-contracts";

export namespace Vehicles {
  /**
   * @description Returns a paginated list of all vehicles.
   * @tags Vehicles
   * @name GetVehicles
   * @summary List vehicles
   * @request GET:/vehicles
   * @response `200` `VehicleListResponse` Paginated list of vehicles
   * @response `400` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace GetVehicles {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Page number (1-based)
       * @default "1"
       * @example "1"
       */
      page?: string;
      /**
       * Number of items per page (max 100)
       * @default "20"
       * @example "20"
       */
      limit?: string;
      /** Filter by kind (TRACTOR_UNIT, SEMI_TRAILER, VAN, BOX_TRUCK) */
      kind?: VehicleKind;
      /**
       * Filter by catalog model id
       * @example "1"
       */
      modelId?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleListResponse;
  }

  /**
   * @description Creates a new vehicle record.
   * @tags Vehicles
   * @name CreateVehicle
   * @summary Create a vehicle
   * @request POST:/vehicles
   * @response `201` `Vehicle` Vehicle created successfully
   * @response `400` `ErrorResponse` Request payload has an invalid structure or contains missing/invalid fields.
   * @response `500` `ErrorResponse`
   */
  export namespace CreateVehicle {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VehicleCreateInput;
    export type RequestHeaders = {};
    export type ResponseBody = Vehicle;
  }

  /**
   * @description Returns a single vehicle by its numeric ID.
   * @tags Vehicles
   * @name GetVehicleById
   * @summary Get vehicle by ID
   * @request GET:/vehicles/{id}
   * @response `200` `VehicleDetail` Vehicle found (with catalog, documents and history)
   * @response `400` `ErrorResponse` The provided ID is missing or has an invalid format.
   * @response `404` `ErrorResponse` No vehicle exists with the given ID.
   * @response `500` `ErrorResponse`
   */
  export namespace GetVehicleById {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleDetail;
  }

  /**
   * @description Replaces vehicle data. All fields are optional – only provided fields are updated.
   * @tags Vehicles
   * @name UpdateVehicle
   * @summary Update a vehicle
   * @request PUT:/vehicles/{id}
   * @response `200` `Vehicle` Vehicle updated successfully
   * @response `400` `ErrorResponse` Request payload has an invalid structure or contains missing/invalid fields.
   * @response `404` `ErrorResponse` No vehicle exists with the given ID, or the update produced no result.
   * @response `500` `ErrorResponse`
   */
  export namespace UpdateVehicle {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = VehicleUpdateInput;
    export type RequestHeaders = {};
    export type ResponseBody = Vehicle;
  }

  /**
   * @description Permanently deletes a vehicle by its ID.
   * @tags Vehicles
   * @name DeleteVehicle
   * @summary Delete a vehicle
   * @request DELETE:/vehicles/{id}
   * @response `204` `void` Vehicle deleted successfully – no body returned.
   * @response `400` `ErrorResponse` The provided ID is not a valid positive integer.
   * @response `404` `ErrorResponse` No vehicle exists with the given ID.
   * @response `500` `ErrorResponse`
   */
  export namespace DeleteVehicle {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * @description Returns documents (dokumenty) attached to a vehicle.
   * @tags Vehicles
   * @name GetVehicleDocuments
   * @summary List vehicle documents
   * @request GET:/vehicles/{id}/documents
   * @response `200` `VehicleDocumentListResponse` List of vehicle documents
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace GetVehicleDocuments {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleDocumentListResponse;
  }

  /**
   * No description
   * @tags Vehicles
   * @name CreateVehicleDocument
   * @summary Add a vehicle document
   * @request POST:/vehicles/{id}/documents
   * @response `201` `VehicleDocument` Document created
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace CreateVehicleDocument {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = VehicleDocumentCreateInput;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleDocument;
  }

  /**
   * No description
   * @tags Vehicles
   * @name DeleteVehicleDocument
   * @summary Delete a vehicle document
   * @request DELETE:/vehicles/{id}/documents/{docId}
   * @response `204` `void` Document deleted
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace DeleteVehicleDocument {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
      /**
       * Document identifier
       * @example 1
       */
      docId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * @description Returns the short history (krótka historia) of a vehicle.
   * @tags Vehicles
   * @name GetVehicleHistory
   * @summary List vehicle history events
   * @request GET:/vehicles/{id}/history
   * @response `200` `VehicleHistoryListResponse` List of vehicle history events
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace GetVehicleHistory {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleHistoryListResponse;
  }

  /**
   * No description
   * @tags Vehicles
   * @name CreateVehicleHistoryEvent
   * @summary Add a vehicle history event
   * @request POST:/vehicles/{id}/history
   * @response `201` `VehicleHistoryEvent` History event created
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace CreateVehicleHistoryEvent {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = VehicleHistoryEventCreateInput;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleHistoryEvent;
  }
}
