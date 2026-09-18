export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agenda_activities: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          priority: string
          property_id: string
          responsible_employee_id: string | null
          status: string
          time: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          priority: string
          property_id: string
          responsible_employee_id?: string | null
          status: string
          time?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          priority?: string
          property_id?: string
          responsible_employee_id?: string | null
          status?: string
          time?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_activities_property_id_responsible_employee_id_fkey"
            columns: ["property_id", "responsible_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      animal_events: {
        Row: {
          animal_id: string
          date: string
          description: string
          id: string
          property_id: string
          type: string
        }
        Insert: {
          animal_id: string
          date?: string
          description: string
          id?: string
          property_id: string
          type: string
        }
        Update: {
          animal_id?: string
          date?: string
          description?: string
          id?: string
          property_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_events_property_id_animal_id_fkey"
            columns: ["property_id", "animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "animal_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          birth_date: string | null
          breed: string
          category: string
          created_at: string
          current_weight: number | null
          id: string
          identification: string
          land_area_id: string | null
          lot_id: string | null
          name: string | null
          notes: string | null
          origin: string | null
          property_id: string
          sex: string
          species: string
          status: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          breed: string
          category: string
          created_at?: string
          current_weight?: number | null
          id?: string
          identification: string
          land_area_id?: string | null
          lot_id?: string | null
          name?: string | null
          notes?: string | null
          origin?: string | null
          property_id: string
          sex: string
          species: string
          status: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          breed?: string
          category?: string
          created_at?: string
          current_weight?: number | null
          id?: string
          identification?: string
          land_area_id?: string | null
          lot_id?: string | null
          name?: string | null
          notes?: string | null
          origin?: string | null
          property_id?: string
          sex?: string
          species?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "animals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: false
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "animals_property_id_lot_id_fkey"
            columns: ["property_id", "lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      crop_cycles: {
        Row: {
          created_at: string
          crop: string
          cultivar: string | null
          expected_harvest_date: string | null
          id: string
          land_area_id: string
          notes: string | null
          planting_date: string | null
          property_id: string
          season: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop: string
          cultivar?: string | null
          expected_harvest_date?: string | null
          id?: string
          land_area_id: string
          notes?: string | null
          planting_date?: string | null
          property_id: string
          season: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop?: string
          cultivar?: string | null
          expected_harvest_date?: string | null
          id?: string
          land_area_id?: string
          notes?: string | null
          planting_date?: string | null
          property_id?: string
          season?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_cycles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycles_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: false
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      crop_managements: {
        Row: {
          created_at: string
          crop_cycle_id: string
          date: string
          description: string
          dose_or_quantity: string | null
          id: string
          notes: string | null
          product_or_material: string | null
          property_id: string
          responsible: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_cycle_id: string
          date: string
          description: string
          dose_or_quantity?: string | null
          id?: string
          notes?: string | null
          product_or_material?: string | null
          property_id: string
          responsible?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_cycle_id?: string
          date?: string
          description?: string
          dose_or_quantity?: string | null
          id?: string
          notes?: string | null
          product_or_material?: string | null
          property_id?: string
          responsible?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_managements_property_id_crop_cycle_id_fkey"
            columns: ["property_id", "crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "crop_managements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          email: string | null
          id: string
          job_function: string
          name: string
          notes: string | null
          phone: string | null
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          job_function: string
          name: string
          notes?: string | null
          phone?: string | null
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          job_function?: string
          name?: string
          notes?: string | null
          phone?: string | null
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          property_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          property_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          property_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          date: string
          description: string
          id: string
          integration_operation_id: string | null
          notes: string | null
          property_id: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          integration_operation_id?: string | null
          notes?: string | null
          property_id: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          integration_operation_id?: string | null
          notes?: string | null
          property_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_property_id_category_id_fkey"
            columns: ["property_id", "category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "financial_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_property_id_integration_operation_i_fkey"
            columns: ["property_id", "integration_operation_id"]
            isOneToOne: false
            referencedRelation: "integration_operations"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      harvest_records: {
        Row: {
          created_at: string
          crop_cycle_id: string
          harvest_date: string
          harvested_area_hectares: number
          id: string
          notes: string | null
          production_quantity: number
          production_unit: string
          property_id: string
          sack_weight_kg: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_cycle_id: string
          harvest_date: string
          harvested_area_hectares: number
          id?: string
          notes?: string | null
          production_quantity: number
          production_unit: string
          property_id: string
          sack_weight_kg?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_cycle_id?: string
          harvest_date?: string
          harvested_area_hectares?: number
          id?: string
          notes?: string | null
          production_quantity?: number
          production_unit?: string
          property_id?: string
          sack_weight_kg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvest_records_property_id_crop_cycle_id_fkey"
            columns: ["property_id", "crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "harvest_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      health_occurrences: {
        Row: {
          animal_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          property_id: string
          severity: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          property_id: string
          severity: string
          status: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          property_id?: string
          severity?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_occurrences_property_id_animal_id_fkey"
            columns: ["property_id", "animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "health_occurrences_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_operations: {
        Row: {
          created_at: string
          id: string
          property_id: string
          source_module: string
          source_record_id: string
          source_type: string
          target_module: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          source_module: string
          source_record_id: string
          source_type: string
          target_module: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          source_module?: string
          source_record_id?: string
          source_type?: string
          target_module?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_operations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          batch_number: string | null
          category: string
          code: string
          created_at: string
          current_quantity: number
          description: string | null
          expiration_date: string | null
          id: string
          location: string | null
          minimum_quantity: number | null
          name: string
          property_id: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          category: string
          code: string
          created_at?: string
          current_quantity?: number
          description?: string | null
          expiration_date?: string | null
          id?: string
          location?: string | null
          minimum_quantity?: number | null
          name: string
          property_id: string
          status: string
          unit: string
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          category?: string
          code?: string
          created_at?: string
          current_quantity?: number
          description?: string | null
          expiration_date?: string | null
          id?: string
          location?: string | null
          minimum_quantity?: number | null
          name?: string
          property_id?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          balance_after: number
          balance_before: number
          created_at: string
          id: string
          integration_operation_id: string | null
          inventory_item_id: string
          item_code_snapshot: string | null
          item_name_snapshot: string | null
          movement_date: string
          notes: string | null
          property_id: string
          quantity: number
          reason: string
          responsible: string | null
          type: string
          unit_snapshot: string | null
        }
        Insert: {
          balance_after: number
          balance_before: number
          created_at?: string
          id?: string
          integration_operation_id?: string | null
          inventory_item_id: string
          item_code_snapshot?: string | null
          item_name_snapshot?: string | null
          movement_date: string
          notes?: string | null
          property_id: string
          quantity: number
          reason: string
          responsible?: string | null
          type: string
          unit_snapshot?: string | null
        }
        Update: {
          balance_after?: number
          balance_before?: number
          created_at?: string
          id?: string
          integration_operation_id?: string | null
          inventory_item_id?: string
          item_code_snapshot?: string | null
          item_name_snapshot?: string | null
          movement_date?: string
          notes?: string | null
          property_id?: string
          quantity?: number
          reason?: string
          responsible?: string | null
          type?: string
          unit_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_property_id_integration_operation_id_fkey"
            columns: ["property_id", "integration_operation_id"]
            isOneToOne: false
            referencedRelation: "integration_operations"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "inventory_movements_property_id_inventory_item_id_fkey"
            columns: ["property_id", "inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      land_area_geographic_boundaries: {
        Row: {
          land_area_id: string
          points: Json
          property_id: string
          updated_at: string
        }
        Insert: {
          land_area_id: string
          points: Json
          property_id: string
          updated_at?: string
        }
        Update: {
          land_area_id?: string
          points?: Json
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "land_area_geographic_boundaries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_area_geographic_boundaries_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: true
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      land_area_map_layouts: {
        Row: {
          height: number
          land_area_id: string
          points: Json | null
          property_id: string
          shape_type: string | null
          updated_at: string
          width: number
          x: number
          y: number
        }
        Insert: {
          height: number
          land_area_id: string
          points?: Json | null
          property_id: string
          shape_type?: string | null
          updated_at?: string
          width: number
          x: number
          y: number
        }
        Update: {
          height?: number
          land_area_id?: string
          points?: Json | null
          property_id?: string
          shape_type?: string | null
          updated_at?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "land_area_map_layouts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_area_map_layouts_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: true
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      land_areas: {
        Row: {
          area_hectares: number
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          property_id: string
          purpose: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          area_hectares: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          property_id: string
          purpose?: string | null
          status: string
          type: string
          updated_at?: string
        }
        Update: {
          area_hectares?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          property_id?: string
          purpose?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "land_areas_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      land_use_records: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          land_area_id: string
          property_id: string
          start_date: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          land_area_id: string
          property_id: string
          start_date: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          land_area_id?: string
          property_id?: string
          start_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "land_use_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_use_records_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: false
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      lots: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_maintenance_records: {
        Row: {
          created_at: string
          hour_meter: number | null
          id: string
          machine_id: string
          maintenance_date: string
          notes: string | null
          property_id: string
          responsible: string | null
          service_performed: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hour_meter?: number | null
          id?: string
          machine_id: string
          maintenance_date: string
          notes?: string | null
          property_id: string
          responsible?: string | null
          service_performed: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hour_meter?: number | null
          id?: string
          machine_id?: string
          maintenance_date?: string
          notes?: string | null
          property_id?: string
          responsible?: string | null
          service_performed?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_maintenance_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_maintenance_records_property_id_machine_id_fkey"
            columns: ["property_id", "machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      machine_usage_records: {
        Row: {
          created_at: string
          crop_cycle_id: string | null
          id: string
          land_area_id: string
          machine_id: string
          notes: string | null
          operation_date: string
          operation_type: string
          property_id: string
          updated_at: string
          worked_hours: number
        }
        Insert: {
          created_at?: string
          crop_cycle_id?: string | null
          id?: string
          land_area_id: string
          machine_id: string
          notes?: string | null
          operation_date: string
          operation_type: string
          property_id: string
          updated_at?: string
          worked_hours: number
        }
        Update: {
          created_at?: string
          crop_cycle_id?: string | null
          id?: string
          land_area_id?: string
          machine_id?: string
          notes?: string | null
          operation_date?: string
          operation_type?: string
          property_id?: string
          updated_at?: string
          worked_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "machine_usage_records_property_id_crop_cycle_id_fkey"
            columns: ["property_id", "crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "machine_usage_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_usage_records_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: false
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "machine_usage_records_property_id_machine_id_fkey"
            columns: ["property_id", "machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      machines: {
        Row: {
          brand: string | null
          category: string
          code: string
          created_at: string
          hour_meter: number | null
          id: string
          identification: string | null
          model: string | null
          name: string
          notes: string | null
          property_id: string
          status: string
          updated_at: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          category: string
          code: string
          created_at?: string
          hour_meter?: number | null
          id?: string
          identification?: string | null
          model?: string | null
          name: string
          notes?: string | null
          property_id: string
          status: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          category?: string
          code?: string
          created_at?: string
          hour_meter?: number | null
          id?: string
          identification?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          property_id?: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      paddock_occupations: {
        Row: {
          created_at: string
          entry_date: string
          exit_date: string | null
          id: string
          land_area_id: string
          lot_id: string
          notes: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          exit_date?: string | null
          id?: string
          land_area_id: string
          lot_id: string
          notes?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          exit_date?: string | null
          id?: string
          land_area_id?: string
          lot_id?: string
          notes?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paddock_occupations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paddock_occupations_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: false
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "paddock_occupations_property_id_lot_id_fkey"
            columns: ["property_id", "lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          created_at: string
          created_by: string
          id: string
          location: string
          name: string
          owner_name: string
          total_area: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          location?: string
          name: string
          owner_name: string
          total_area?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          location?: string
          name?: string
          owner_name?: string
          total_area?: number
          updated_at?: string
        }
        Relationships: []
      }
      property_geographic_boundaries: {
        Row: {
          points: Json
          property_id: string
          updated_at: string
        }
        Insert: {
          points: Json
          property_id: string
          updated_at?: string
        }
        Update: {
          points?: Json
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_geographic_boundaries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_map_locations: {
        Row: {
          latitude: number
          longitude: number
          property_id: string
          updated_at: string
        }
        Insert: {
          latitude: number
          longitude: number
          property_id: string
          updated_at?: string
        }
        Update: {
          latitude?: number
          longitude?: number
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_map_locations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_members: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          permissions: string[]
          property_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          permissions?: string[]
          property_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          permissions?: string[]
          property_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_members_property_id_employee_id_fkey"
            columns: ["property_id", "employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "property_members_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rural_structure_land_areas: {
        Row: {
          land_area_id: string
          property_id: string
          rural_structure_id: string
        }
        Insert: {
          land_area_id: string
          property_id: string
          rural_structure_id: string
        }
        Update: {
          land_area_id?: string
          property_id?: string
          rural_structure_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rural_structure_land_areas_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rural_structure_land_areas_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: false
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "rural_structure_land_areas_property_id_rural_structure_id_fkey"
            columns: ["property_id", "rural_structure_id"]
            isOneToOne: false
            referencedRelation: "rural_structures"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      rural_structures: {
        Row: {
          code: string
          condition: string
          created_at: string
          description: string | null
          id: string
          length_meters: number | null
          name: string
          property_id: string
          status: string
          type: string
          updated_at: string
          width_meters: number | null
        }
        Insert: {
          code: string
          condition: string
          created_at?: string
          description?: string | null
          id?: string
          length_meters?: number | null
          name: string
          property_id: string
          status: string
          type: string
          updated_at?: string
          width_meters?: number | null
        }
        Update: {
          code?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          length_meters?: number | null
          name?: string
          property_id?: string
          status?: string
          type?: string
          updated_at?: string
          width_meters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rural_structures_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      soil_analyses: {
        Row: {
          aluminum: number | null
          aluminum_saturation: number | null
          base_saturation: number | null
          calcium: number | null
          cec: number | null
          created_at: string
          id: string
          laboratory: string | null
          land_area_id: string
          magnesium: number | null
          notes: string | null
          organic_matter: number | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
          property_id: string
          sample_code: string | null
          sample_date: string
          sample_depth: string | null
          updated_at: string
        }
        Insert: {
          aluminum?: number | null
          aluminum_saturation?: number | null
          base_saturation?: number | null
          calcium?: number | null
          cec?: number | null
          created_at?: string
          id?: string
          laboratory?: string | null
          land_area_id: string
          magnesium?: number | null
          notes?: string | null
          organic_matter?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          property_id: string
          sample_code?: string | null
          sample_date: string
          sample_depth?: string | null
          updated_at?: string
        }
        Update: {
          aluminum?: number | null
          aluminum_saturation?: number | null
          base_saturation?: number | null
          calcium?: number | null
          cec?: number | null
          created_at?: string
          id?: string
          laboratory?: string | null
          land_area_id?: string
          magnesium?: number | null
          notes?: string | null
          organic_matter?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          property_id?: string
          sample_code?: string | null
          sample_date?: string
          sample_depth?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soil_analyses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soil_analyses_property_id_land_area_id_fkey"
            columns: ["property_id", "land_area_id"]
            isOneToOne: false
            referencedRelation: "land_areas"
            referencedColumns: ["property_id", "id"]
          },
        ]
      }
      treatments: {
        Row: {
          animal_id: string
          created_at: string
          dosage: string | null
          end_date: string | null
          id: string
          medication: string | null
          notes: string | null
          property_id: string
          reason: string
          responsible: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          medication?: string | null
          notes?: string | null
          property_id: string
          reason: string
          responsible?: string | null
          start_date: string
          status: string
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          medication?: string | null
          notes?: string | null
          property_id?: string
          reason?: string
          responsible?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_property_id_animal_id_fkey"
            columns: ["property_id", "animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "treatments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          animal_id: string
          application_date: string
          batch: string | null
          created_at: string
          dose: string | null
          id: string
          next_dose_date: string | null
          notes: string | null
          property_id: string
          responsible: string | null
          updated_at: string
          vaccine_name: string
        }
        Insert: {
          animal_id: string
          application_date: string
          batch?: string | null
          created_at?: string
          dose?: string | null
          id?: string
          next_dose_date?: string | null
          notes?: string | null
          property_id: string
          responsible?: string | null
          updated_at?: string
          vaccine_name: string
        }
        Update: {
          animal_id?: string
          application_date?: string
          batch?: string | null
          created_at?: string
          dose?: string | null
          id?: string
          next_dose_date?: string | null
          notes?: string | null
          property_id?: string
          responsible?: string | null
          updated_at?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_property_id_animal_id_fkey"
            columns: ["property_id", "animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["property_id", "id"]
          },
          {
            foreignKeyName: "vaccinations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_property_for_current_user: {
        Args: {
          p_location: string
          p_name: string
          p_owner_name: string
          p_total_area: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
