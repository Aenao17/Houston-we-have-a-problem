package com.theboysstudio.backend.domain;

import lombok.Getter;
import java.text.DecimalFormat;

@Getter
public class MyNumber {
    private Double base;
    private Integer zeroes;

    public MyNumber(Double base, Integer zeroes) {
        this.base = base;
        this.zeroes = zeroes;
        adjust();
    }

    public MyNumber multiply(MyNumber other) {
        Double newBase = this.base * other.base;
        Integer newZeroes = this.zeroes + other.zeroes;
        MyNumber newNumber = new MyNumber(newBase, newZeroes);
        newNumber.adjust();
        return newNumber;
    }

    public MyNumber multiply(int number) {
        MyNumber newNumber = new MyNumber(this.base, this.zeroes);
        newNumber.base *= number;
        newNumber.adjust();
        return newNumber;
    }

    public MyNumber multiply(double number) {
        MyNumber newNumber = new MyNumber(this.base, this.zeroes);
        newNumber.base *= number;
        newNumber.adjust();
        return newNumber;
    }

    private void adjust() {
        int precision = 5;
        if (base > -1 && base < 1) {
            int copy = precision;
            while (base - base.intValue() != 0 && copy > 0) {
                base = base * 10;
                zeroes--;
                copy--;
            }
        } else {
            int copy = precision;
            while (base % 10 == 0 && copy > 0) {
                base = base / 10;
                zeroes++;
                copy--;
            }
        }
    }

    @Override
    public String toString() {
        return base + " * 10^" + zeroes;
    }

    public MyNumber sqrt() {
        MyNumber newNumber = new MyNumber(this.base, this.zeroes);
        if (newNumber.zeroes % 2 == 1) {
            newNumber.zeroes -= 1;
            newNumber.base *= 10;
        }
        newNumber.zeroes /= 2;
        newNumber.base = Math.sqrt(base);
        newNumber.adjust();
        return newNumber;
    }

    public MyNumber divide(int number) {
        MyNumber newNumber = new MyNumber(this.base, this.zeroes);
        newNumber.base = newNumber.base / number;
        newNumber.adjust();
        return newNumber;
    }

    public MyNumber divide(double number) {
        MyNumber newNumber = new MyNumber(this.base, this.zeroes);
        newNumber.base = newNumber.base / number;
        newNumber.adjust();
        return newNumber;
    }

    public MyNumber divide(MyNumber number) {
        MyNumber newNumber = new MyNumber(this.base, this.zeroes);
        newNumber.base = newNumber.base / number.base;
        newNumber.zeroes = newNumber.zeroes - number.zeroes;
        newNumber.adjust();
        return newNumber;
    }

    public double evaluate(){
        int copy=this.zeroes;
        double number=this.base;
        if(copy>0){
            while(copy>0){
                number*=10;
                copy--;
            }
        }else if(copy<0){
            while(copy<0){
                number/=10;
                copy++;
            }
        }
        return Double.parseDouble(new DecimalFormat("#.#####").format(number));
    }
}