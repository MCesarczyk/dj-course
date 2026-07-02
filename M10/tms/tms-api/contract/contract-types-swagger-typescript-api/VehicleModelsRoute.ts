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
  VehicleKind,
  VehicleModel,
  VehicleModelCreateInput,
  VehicleModelListResponse,
  VehicleModelUpdateInput,
} from "./data-contracts";

export namespace VehicleModels {
  /**
   * @description Returns a paginated list of vehicle models (modele). Each model belongs to a brand and is either a TRACTOR_UNIT (ciągnik siodłowy) or a SEMI_TRAILER (naczepa) — for trailers, `trailerType` describes the body kind.
   * @tags VehicleModels
   * @name GetVehicleModels
   * @summary List vehicle models
   * @request GET:/vehicle-models
   * @response `200` `VehicleModelListResponse` Paginated list of vehicle models
   * @response `400` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace GetVehicleModels {
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
      /**
       * Filter by brand id
       * @example "1"
       */
      brandId?: string;
      /** Filter by kind (TRACTOR_UNIT or SEMI_TRAILER) */
      kind?: VehicleKind;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleModelListResponse;
  }

  /**
   * No description
   * @tags VehicleModels
   * @name CreateVehicleModel
   * @summary Create a vehicle model
   * @request POST:/vehicle-models
   * @response `201` `VehicleModel` Vehicle model created
   * @response `400` `ErrorResponse`
   * @response `409` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace CreateVehicleModel {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VehicleModelCreateInput;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleModel;
  }

  /**
   * No description
   * @tags VehicleModels
   * @name GetVehicleModelById
   * @summary Get vehicle model by ID
   * @request GET:/vehicle-models/{id}
   * @response `200` `VehicleModel` Vehicle model found
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace GetVehicleModelById {
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
    export type ResponseBody = VehicleModel;
  }

  /**
   * No description
   * @tags VehicleModels
   * @name UpdateVehicleModel
   * @summary Update a vehicle model
   * @request PUT:/vehicle-models/{id}
   * @response `200` `VehicleModel` Vehicle model updated
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `409` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace UpdateVehicleModel {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = VehicleModelUpdateInput;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleModel;
  }

  /**
   * No description
   * @tags VehicleModels
   * @name DeleteVehicleModel
   * @summary Delete a vehicle model
   * @request DELETE:/vehicle-models/{id}
   * @response `204` `void` Vehicle model deleted
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `409` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace DeleteVehicleModel {
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
}
