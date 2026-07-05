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
  VehicleBrand,
  VehicleBrandCreateInput,
  VehicleBrandListResponse,
  VehicleBrandUpdateInput,
} from "./data-contracts";

export namespace VehicleBrands {
  /**
   * @description Returns a paginated list of vehicle brands (marki).
   * @tags VehicleBrands
   * @name GetVehicleBrands
   * @summary List vehicle brands
   * @request GET:/vehicle-brands
   * @response `200` `VehicleBrandListResponse` Paginated list of vehicle brands
   * @response `400` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace GetVehicleBrands {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleBrandListResponse;
  }

  /**
   * No description
   * @tags VehicleBrands
   * @name CreateVehicleBrand
   * @summary Create a vehicle brand
   * @request POST:/vehicle-brands
   * @response `201` `VehicleBrand` Vehicle brand created
   * @response `400` `ErrorResponse`
   * @response `409` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace CreateVehicleBrand {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = VehicleBrandCreateInput;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleBrand;
  }

  /**
   * No description
   * @tags VehicleBrands
   * @name GetVehicleBrandById
   * @summary Get vehicle brand by ID
   * @request GET:/vehicle-brands/{id}
   * @response `200` `VehicleBrand` Vehicle brand found
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace GetVehicleBrandById {
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
    export type ResponseBody = VehicleBrand;
  }

  /**
   * No description
   * @tags VehicleBrands
   * @name UpdateVehicleBrand
   * @summary Update a vehicle brand
   * @request PUT:/vehicle-brands/{id}
   * @response `200` `VehicleBrand` Vehicle brand updated
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `409` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace UpdateVehicleBrand {
    export type RequestParams = {
      /**
       * Numeric resource identifier
       * @example 1
       */
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = VehicleBrandUpdateInput;
    export type RequestHeaders = {};
    export type ResponseBody = VehicleBrand;
  }

  /**
   * No description
   * @tags VehicleBrands
   * @name DeleteVehicleBrand
   * @summary Delete a vehicle brand
   * @request DELETE:/vehicle-brands/{id}
   * @response `204` `void` Vehicle brand deleted
   * @response `400` `ErrorResponse`
   * @response `404` `ErrorResponse`
   * @response `500` `ErrorResponse`
   */
  export namespace DeleteVehicleBrand {
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
